"""Kafka producer implementation with retry logic"""

from aiokafka import AIOKafkaProducer
from typing import Dict, Any, Optional
import json
import logging

from dataquarantine.config.settings import settings

logger = logging.getLogger(__name__)


class KafkaMessageProducer:
    """
    Async Kafka producer with retry logic and acknowledgment.
    
    Features:
    - Wait for all replicas (acks='all')
    - Automatic retries
    - Idempotent writes
    - Graceful shutdown
    """
    
    def __init__(
        self,
        bootstrap_servers: Optional[str] = None,
        acks: str = "all",
        retries: int = 3
    ):
        self.bootstrap_servers = bootstrap_servers or settings.kafka_bootstrap_servers
        self.acks = acks
        self.retries = retries
        
        self.producer: Optional[AIOKafkaProducer] = None
        self._running = False
        
        logger.info(
            f"KafkaMessageProducer configured: "
            f"servers={self.bootstrap_servers}, acks={self.acks}"
        )
    
    async def start(self):
        """Initialize and start the producer"""
        try:
            self.producer = AIOKafkaProducer(
                bootstrap_servers=self.bootstrap_servers,
                acks=self.acks,  # Wait for all replicas
                retries=self.retries,
                enable_idempotence=True,  # Prevent duplicates
                value_serializer=self._serialize_message
            )
            
            await self.producer.start()
            self._running = True
            
            logger.info("Kafka producer started successfully")
            
        except Exception as e:
            logger.error(f"Failed to start Kafka producer: {e}", exc_info=True)
            raise
    
    def _serialize_message(self, value: Dict[str, Any]) -> bytes:
        """Serialize message value from dict to bytes"""
        return json.dumps(value).encode('utf-8')
    
    async def send_message(
        self,
        topic: str,
        value: Dict[str, Any],
        key: Optional[str] = None
    ) -> bool:
        """
        Send a message to Kafka topic.
        
        Args:
            topic: Topic name
            value: Message payload (dict)
            key: Optional message key for partitioning
            
        Returns:
            True if successful, False otherwise
        """
        if not self._running:
            raise RuntimeError("Producer not started. Call start() first.")
        
        try:
            key_bytes = key.encode('utf-8') if key else None
            
            # Send and wait for acknowledgment
            metadata = await self.producer.send_and_wait(
                topic,
                value=value,
                key=key_bytes
            )
            
            logger.debug(
                f"Message sent to {topic} "
                f"(partition={metadata.partition}, offset={metadata.offset})"
            )
            
            return True
            
        except Exception as e:
            logger.error(
                f"Failed to send message to {topic}: {e}",
                exc_info=True
            )
            return False
    
    async def send_batch(
        self,
        topic: str,
        messages: list[Dict[str, Any]]
    ) -> int:
        """
        Send multiple messages in batch.
        
        Args:
            topic: Topic name
            messages: List of message payloads
            
        Returns:
            Number of successfully sent messages
        """
        success_count = 0
        
        for msg in messages:
            if await self.send_message(topic, msg):
                success_count += 1
        
        logger.info(
            f"Batch send complete: {success_count}/{len(messages)} successful"
        )
        
        return success_count
    
    async def stop(self):
        """Stop the producer gracefully"""
        if self.producer and self._running:
            try:
                await self.producer.stop()
                self._running = False
                logger.info("Kafka producer stopped successfully")
            except Exception as e:
                logger.error(f"Error stopping producer: {e}", exc_info=True)
    
    def is_running(self) -> bool:
        """Check if producer is running"""
        return self._running
