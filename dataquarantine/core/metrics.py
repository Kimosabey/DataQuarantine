"""Prometheus metrics collector"""

from prometheus_client import Counter, Histogram, Gauge, start_http_server
from typing import Optional
import logging

from dataquarantine.config.settings import settings

logger = logging.getLogger(__name__)


class MetricsCollector:
    """
    Collects and exposes Prometheus metrics for DataQuarantine.
    
    Metrics:
    - Total records processed
    - Valid/invalid record counts
    - Validation duration
    - Quarantine operations
    - Kafka consumer lag
    """
    
    def __init__(self):
        # Records processed
        self.records_processed = Counter(
            'dataquarantine_records_processed_total',
            'Total number of records processed',
            ['topic', 'schema']
        )
        
        # Valid records
        self.records_valid = Counter(
            'dataquarantine_records_valid_total',
            'Total number of valid records',
            ['topic', 'schema']
        )
        
        # Invalid records
        self.records_invalid = Counter(
            'dataquarantine_records_invalid_total',
            'Total number of invalid records',
            ['topic', 'schema', 'error_type']
        )
        
        # Quarantined records
        self.records_quarantined = Counter(
            'dataquarantine_records_quarantined_total',
            'Total number of quarantined records',
            ['topic', 'schema', 'error_type']
        )
        
        # Validation duration
        self.validation_duration = Histogram(
            'dataquarantine_validation_duration_seconds',
            'Time spent validating messages',
            ['schema'],
            buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0]
        )
        
        # Kafka consumer lag
        self.consumer_lag = Gauge(
            'dataquarantine_kafka_lag',
            'Kafka consumer lag',
            ['topic', 'partition']
        )
        
        # System errors
        self.system_errors = Counter(
            'dataquarantine_system_errors_total',
            'Total number of system errors',
            ['error_type']
        )
        
        logger.info("MetricsCollector initialized")
    
    def record_processed(self, topic: str, schema: str):
        """Record a processed message"""
        self.records_processed.labels(topic=topic, schema=schema).inc()
    
    def record_valid(self, schema: str, topic: str = "unknown"):
        """Record a valid message"""
        self.records_valid.labels(topic=topic, schema=schema).inc()
        self.record_processed(topic, schema)
    
    def record_invalid(self, schema: str, error_type: str, topic: str = "unknown"):
        """Record an invalid message"""
        self.records_invalid.labels(
            topic=topic,
            schema=schema,
            error_type=error_type
        ).inc()
        self.record_processed(topic, schema)
    
    def record_quarantined(self, topic: str, schema: str, error_type: str):
        """Record a quarantined message"""
        self.records_quarantined.labels(
            topic=topic,
            schema=schema,
            error_type=error_type
        ).inc()
    
    def record_duration(self, schema: str, duration: float):
        """Record validation duration"""
        self.validation_duration.labels(schema=schema).observe(duration)
    
    def record_error(self, error_type: str):
        """Record a system error"""
        self.system_errors.labels(error_type=error_type).inc()
    
    def set_consumer_lag(self, topic: str, partition: int, lag: int):
        """Set consumer lag for a partition"""
        self.consumer_lag.labels(topic=topic, partition=str(partition)).set(lag)
    
    def start_server(self, port: Optional[int] = None):
        """Start Prometheus metrics HTTP server"""
        port = port or settings.prometheus_port
        start_http_server(port)
        logger.info(f"Prometheus metrics server started on port {port}")


# Global metrics instance
metrics = MetricsCollector()
