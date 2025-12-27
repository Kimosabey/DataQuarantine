"""Kafka consumer implementation with manual offset management"""

from aiokafka import AIOKafkaConsumer, TopicPartition
from typing import AsyncIterator, Dict, Any, Optional
import json
import logging

from dataquarantine.config.settings import settings

logger = logging.getLogger(__name__)


class KafkaMessageConsumer:
    """
    Async Kafka consumer with manual offset management.
    
    Features:
    - Manual offset commit (at-least-once delivery)
    - Batch consumption
    - Automatic reconnection
    - Graceful shutdown
    
    This ensures NO DATA LOSS - offsets are only committed
    after successful processing.
    """
    
    def __init__(
        self,
        bootstrap_servers: Optional[str] = None,
        topic: Optional[str] = None,
        group_id: Optional[str] = None,
        max_poll_records: Optional[int] = None,
        auto_offset_reset: Optional[str] = None
    ):
        self.bootstrap_servers = bootstrap_servers or settings.kafka_bootstrap_servers
        self.topic = topic or settings.kafka_raw_topic
        self.group_id = group_id or settings.kafka_consumer_group_id
        self.max_poll_records = max_poll_records or settings.kafka_max_poll_records
        self.auto_offset_reset = auto_offset_reset or settings.kafka_auto_offset_reset
        
        self.consumer: Optional[AIOKafkaConsumer] = None
        self._running = False
        
        logger.info(
            f"KafkaMessageConsumer configured: "
            f"topic={self.topic}, group={self.group_id}"
        )
    
    async def start(self):
        """Initialize and start the consumer"""
        try:
            self.consumer = AIOKafkaConsumer(
                self.topic,
                bootstrap_servers=self.bootstrap_servers,
                group_id=self.group_id,
                enable_auto_commit=False,  # CRITICAL: Manual commit only
                auto_offset_reset=self.auto_offset_reset,
                max_poll_records=self.max_poll_records,
                value_deserializer=self._deserialize_message
            )
            
            await self.consumer.start()
            self._running = True
            
            logger.info(
                f"Kafka consumer started successfully for topic: {self.topic}"
            )
            
        except Exception as e:
            logger.error(f"Failed to start Kafka consumer: {e}", exc_info=True)
            raise
    
    def _deserialize_message(self, raw_value: bytes) -> Dict[str, Any]:
        """Deserialize message value from bytes to dict"""
        try:
            return json.loads(raw_value.decode('utf-8'))
        except json.JSONDecodeError as e:
            logger.error(f"Failed to deserialize message: {e}")
            # Return raw value wrapped in error structure
            return {
                "_deserialization_error": True,
                "_raw_value": raw_value.decode('utf-8', errors='replace'),
                "_error": str(e)
            }
    
    async def consume_batch(self) -> AsyncIterator[Dict[str, Any]]:
        """
        Consume messages in batches.
        
        Yields:
            Message dict with keys:
            - value: The message payload
            - topic: Topic name
            - partition: Partition number
            - offset: Message offset
            - timestamp: Message timestamp
            - key: Message key (if present)
        """
        if not self._running:
            raise RuntimeError("Consumer not started. Call start() first.")
        
        try:
            async for msg in self.consumer:
                yield {
                    "value": msg.value,
                    "topic": msg.topic,
                    "partition": msg.partition,
                    "offset": msg.offset,
                    "timestamp": msg.timestamp,
                    "key": msg.key.decode('utf-8') if msg.key else None
                }
                
        except Exception as e:
            logger.error(f"Error consuming messages: {e}", exc_info=True)
            raise
    
    async def commit_offset(
        self,
        topic: str,
        partition: int,
        offset: int
    ):
        """
        Manually commit offset after successful processing.
        
        This ensures at-least-once delivery semantics.
        Offsets are committed ONLY after the message has been
        successfully validated and routed.
        
        Args:
            topic: Topic name
            partition: Partition number
            offset: Offset to commit (will commit offset + 1)
        """
        try:
            tp = TopicPartition(topic, partition)
            # Commit offset + 1 (next message to consume)
            await self.consumer.commit({tp: offset + 1})
            
            logger.debug(
                f"Committed offset {offset} for {topic}:{partition}"
            )
            
        except Exception as e:
            logger.error(
                f"Failed to commit offset {offset} for {topic}:{partition}: {e}",
                exc_info=True
            )
            # Don't raise - we'll retry on next message
    
    async def get_lag(self) -> Dict[str, int]:
        """
        Get consumer lag for all assigned partitions.
        
        Returns:
            Dict mapping "topic:partition" to lag value
        """
        if not self.consumer:
            return {}
        
        lag_info = {}
        
        try:
            for tp in self.consumer.assignment():
                # Get current position
                position = await self.consumer.position(tp)
                
                # Get end offset (high water mark)
                end_offsets = await self.consumer.end_offsets([tp])
                end_offset = end_offsets.get(tp, 0)
                
                # Calculate lag
                lag = end_offset - position
                lag_info[f"{tp.topic}:{tp.partition}"] = lag
                
        except Exception as e:
            logger.error(f"Failed to get consumer lag: {e}")
        
        return lag_info
    
    async def stop(self):
        """Stop the consumer gracefully"""
        if self.consumer and self._running:
            try:
                await self.consumer.stop()
                self._running = False
                logger.info("Kafka consumer stopped successfully")
            except Exception as e:
                logger.error(f"Error stopping consumer: {e}", exc_info=True)
    
    def is_running(self) -> bool:
        """Check if consumer is running"""
        return self._running
