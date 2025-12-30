"""
DataQuarantine Main Application

This is the entry point for the DataQuarantine streaming schema enforcer.
It orchestrates the entire validation pipeline:

1. Consume messages from Kafka (raw-events topic)
2. Validate against schemas
3. Route valid messages to validated-events topic
4. Quarantine invalid messages to DLQ topic
5. Emit metrics for monitoring
"""

import asyncio
import signal
import sys
import logging
import json
from typing import Optional
from minio import Minio
from minio.error import S3Error

from dataquarantine.config.settings import settings
from dataquarantine.config.logging_config import logger
from dataquarantine.core.validator_engine import (
    ValidatorEngine,
    ValidationResult
)
from dataquarantine.core.schema_registry import SchemaRegistry
from dataquarantine.core.metrics import metrics
from dataquarantine.validators.json_schema import JSONSchemaValidator
from dataquarantine.streaming.kafka_consumer import KafkaMessageConsumer
from dataquarantine.streaming.kafka_producer import KafkaMessageProducer
from dataquarantine.api import app as fastapi_app
from dataquarantine.core.database import SessionLocal
from dataquarantine.core.models import QuarantineRecord
import uvicorn
import datetime
import time
import io


class DataQuarantineApp:
    """
    Main application orchestrator for DataQuarantine.
    
    Responsibilities:
    - Initialize all components
    - Run the main processing loop
    - Handle graceful shutdown
    - Manage component lifecycle
    """
    
    def __init__(self):
        self.consumer: Optional[KafkaMessageConsumer] = None
        self.producer: Optional[KafkaMessageProducer] = None
        self.validator_engine: Optional[ValidatorEngine] = None
        self.schema_registry: Optional[SchemaRegistry] = None
        self.api_server: Optional[uvicorn.Server] = None
        
        self.running = False
        self.shutdown_event = asyncio.Event()
        
        logger.info(
            f"DataQuarantine v{settings.app_version} initializing "
            f"(environment: {settings.environment})"
        )
    
    async def initialize(self):
        """Initialize all components"""
        logger.info("Initializing DataQuarantine components...")
        
        try:
            # 1. Start Prometheus metrics server
            if settings.metrics_enabled:
                metrics.start_server(settings.prometheus_port)
                logger.info(
                    f"Metrics server started on port {settings.prometheus_port}"
                )
            
            # 2. Initialize Kafka consumer
            self.consumer = KafkaMessageConsumer(
                bootstrap_servers=settings.kafka_bootstrap_servers,
                topic=settings.kafka_raw_topic,
                group_id=settings.kafka_consumer_group_id,
                max_poll_records=settings.kafka_max_poll_records
            )
            await self.consumer.start()
            
            # 3. Initialize Kafka producer
            self.producer = KafkaMessageProducer(
                bootstrap_servers=settings.kafka_bootstrap_servers
            )
            await self.producer.start()
            
            # 4. Initialize schema registry
            self.schema_registry = SchemaRegistry(
                schema_directory=settings.schema_directory
            )
            
            # 5. Initialize validator engine
            validators = [
                JSONSchemaValidator()
            ]
            
            self.validator_engine = ValidatorEngine(
                schema_registry=self.schema_registry,
                validators=validators,
                enable_auto_remediation=settings.enable_auto_remediation
            )
            
            # 6. Initialize API Server
            config = uvicorn.Config(
                fastapi_app, 
                host="0.0.0.0", 
                port=settings.api_port if hasattr(settings, 'api_port') else 8080,
                log_level="info"
            )
            self.api_server = uvicorn.Server(config)
            
            logger.info("✅ All components initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize components: {e}", exc_info=True)
            await self.shutdown()
            raise
    
    async def process_messages(self):
        """
        Main processing loop.
        
        This is the heart of DataQuarantine:
        1. Consume message from raw topic
        2. Validate against schema
        3. Route to appropriate topic (valid or DLQ)
        4. Commit offset (only after successful processing)
        """
        self.running = True
        logger.info("🚀 Starting message processing loop...")
        
        message_count = 0
        
        try:
            async for message in self.consumer.consume_batch():
                # Check for shutdown signal
                if self.shutdown_event.is_set():
                    logger.info("Shutdown signal received, stopping processing")
                    break
                
                message_count += 1
                
                try:
                    # Extract message details
                    payload = message["value"]
                    topic = message["topic"]
                    partition = message["partition"]
                    offset = message["offset"]
                    
                    # TODO: Extract schema name from message metadata
                    # For now, using a default schema
                    schema_name = payload.get("_schema", "default_schema")
                    
                    logger.debug(
                        f"Processing message {message_count}: "
                        f"{topic}:{partition}:{offset}"
                    )
                    
                    # Validate message
                    outcome = await self.validator_engine.validate_message(
                        message=payload,
                        schema_name=schema_name,
                        schema_version="latest",
                        topic=topic
                    )
                    
                    # Route based on validation result
                    if outcome.result == ValidationResult.VALID:
                        # Send to valid topic
                        success = await self.producer.send_message(
                            topic=settings.kafka_valid_topic,
                            value=payload,
                            key=message.get("key")
                        )
                        
                        if success:
                            logger.debug(
                                f"✅ Valid message routed to {settings.kafka_valid_topic}"
                            )
                            
                            # Store valid message in MinIO
                            storage_path = f"validated/{topic}/{partition}/{offset}.json"
                            try:
                                # Initialize MinIO client
                                minio_client = Minio(
                                    settings.minio_endpoint.replace('http://', '').replace('https://', ''),
                                    access_key=settings.minio_access_key,
                                    secret_key=settings.minio_secret_key,
                                    secure=False
                                )
                                
                                # Ensure bucket exists
                                bucket_name = "validated-data"
                                if not minio_client.bucket_exists(bucket_name):
                                    minio_client.make_bucket(bucket_name)
                                
                                # Save file to MinIO
                                file_content = json.dumps(payload, indent=2)
                                file_bytes = file_content.encode('utf-8')
                                file_stream = io.BytesIO(file_bytes)
                                
                                minio_client.put_object(
                                    bucket_name,
                                    storage_path,
                                    file_stream,
                                    length=len(file_bytes),
                                    content_type='application/json'
                                )
                                logger.info(f"✅ Saved valid to MinIO: {storage_path}")
                            except Exception as minio_err:
                                logger.error(f"Failed to save valid message to MinIO: {minio_err}")
                        else:
                            logger.error("Failed to send valid message")
                            continue  # Don't commit offset
                    
                    else:
                        # Invalid or error - send to DLQ
                        dlq_payload = {
                            "original_message": payload,
                            "validation_error": outcome.to_dict(),
                            "source_topic": topic,
                            "source_partition": partition,
                            "source_offset": offset
                        }
                        
                        success = await self.producer.send_message(
                            topic=settings.kafka_dlq_topic,
                            value=dlq_payload,
                            key=message.get("key")
                        )
                        
                        if success:
                            logger.warning(
                                f"❌ Invalid message quarantined to DLQ: "
                                f"{outcome.error_type} - {outcome.error_message}"
                            )
                            
                            # Store in MinIO
                            storage_path = f"quarantine/{topic}/{partition}/{offset}.json"
                            try:
                                # Initialize MinIO client
                                minio_client = Minio(
                                    settings.minio_endpoint.replace('http://', '').replace('https://', ''),
                                    access_key=settings.minio_access_key,
                                    secret_key=settings.minio_secret_key,
                                    secure=False
                                )
                                
                                # Ensure bucket exists
                                bucket_name = "data-quarantine"
                                if not minio_client.bucket_exists(bucket_name):
                                    minio_client.make_bucket(bucket_name)
                                
                                # Save file to MinIO
                                file_content = json.dumps(dlq_payload, indent=2)
                                file_bytes = file_content.encode('utf-8')
                                file_stream = io.BytesIO(file_bytes)
                                
                                minio_client.put_object(
                                    bucket_name,
                                    storage_path,
                                    file_stream,
                                    length=len(file_bytes),
                                    content_type='application/json'
                                )
                                logger.info(f"✅ Saved to MinIO: {storage_path}")
                            except Exception as minio_err:
                                logger.error(f"Failed to save to MinIO: {minio_err}")
                            
                            # Store in PostgreSQL
                            try:
                                with SessionLocal() as db:
                                    record = QuarantineRecord(
                                        topic=topic,
                                        partition=partition,
                                        kafka_offset=offset,
                                        timestamp=datetime.datetime.fromtimestamp(message.get('timestamp', time.time())/1000),
                                        schema_name=schema_name,
                                        schema_version="latest",
                                        error_type=outcome.error_type or "unknown",
                                        error_message=outcome.error_message or "Unknown validation error",
                                        field_path=outcome.field_path,
                                        storage_path=storage_path
                                    )
                                    db.add(record)
                                    db.commit()
                                    logger.info(f"✅ Saved to PostgreSQL: record_id={record.id}")
                            except Exception as db_err:
                                logger.error(f"Failed to save to database: {db_err}")
                        else:
                            logger.error("Failed to send message to DLQ")
                            continue  # Don't commit offset
                    
                    # Commit offset (only after successful processing)
                    await self.consumer.commit_offset(topic, partition, offset)
                    
                    # Periodic lag monitoring
                    if message_count % 100 == 0:
                        await self._report_lag()
                    
                except Exception as e:
                    logger.error(
                        f"Error processing message {message_count}: {e}",
                        exc_info=True
                    )
                    metrics.record_error("message_processing_error")
                    # Don't commit offset - will retry
                
        except Exception as e:
            logger.error(f"Fatal error in processing loop: {e}", exc_info=True)
            raise
        
        finally:
            logger.info(f"Processing loop ended. Total messages: {message_count}")
    
    async def _report_lag(self):
        """Report consumer lag to metrics"""
        try:
            lag_info = await self.consumer.get_lag()
            for tp_key, lag in lag_info.items():
                topic, partition = tp_key.split(":")
                metrics.set_consumer_lag(topic, int(partition), lag)
                
                if lag > 1000:
                    logger.warning(f"High consumer lag detected: {tp_key} = {lag}")
        except Exception as e:
            logger.error(f"Failed to report lag: {e}")
    
    async def shutdown(self):
        """Graceful shutdown of all components"""
        logger.info("🛑 Shutting down DataQuarantine...")
        self.running = False
        self.shutdown_event.set()
        
        # Stop consumer (will finish current batch)
        if self.consumer:
            await self.consumer.stop()
        
        # Stop producer (will flush pending messages)
        if self.producer:
            await self.producer.stop()
        
        logger.info("✅ Shutdown complete")
    
    def setup_signal_handlers(self):
        """Setup signal handlers for graceful shutdown"""
        def signal_handler(sig, frame):
            logger.info(f"Received signal {sig}, initiating shutdown...")
            self.shutdown_event.set()
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)


async def main():
    """Main entry point"""
    app = DataQuarantineApp()
    app.setup_signal_handlers()
    
    try:
        # Initialize
        await app.initialize()
        
        # Start API server in a separate task
        api_task = asyncio.create_task(app.api_server.serve())
        
        # Run processing loop
        await app.process_messages()
        
        # Wait for API to stop
        await api_task
        
    except KeyboardInterrupt:
        logger.info("Keyboard interrupt received")
    except Exception as e:
        logger.error(f"Application error: {e}", exc_info=True)
        sys.exit(1)
    finally:
        await app.shutdown()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Application terminated by user")
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)
