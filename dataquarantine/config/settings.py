"""Configuration management using Pydantic Settings"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Application
    app_name: str = "DataQuarantine"
    app_version: str = "1.0.0"
    environment: str = "development"
    log_level: str = "INFO"
    
    # Kafka Configuration
    kafka_bootstrap_servers: str = "localhost:9092"
    kafka_consumer_group_id: str = "dataquarantine-validators"
    kafka_auto_offset_reset: str = "earliest"
    kafka_enable_auto_commit: bool = False
    kafka_max_poll_records: int = 500
    
    # Kafka Topics
    kafka_raw_topic: str = "raw-events"
    kafka_valid_topic: str = "validated-events"
    kafka_dlq_topic: str = "quarantine-dlq"
    
    # Database
    database_url: str = "postgresql://quarantine_user:quarantine_pass@localhost:5432/dataquarantine"
    db_pool_size: int = 20
    db_max_overflow: int = 10
    
    # MinIO/S3
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "data-quarantine"
    minio_secure: bool = False
    
    # Redis
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0
    redis_password: Optional[str] = None
    
    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8080
    api_workers: int = 4
    
    # Monitoring
    prometheus_port: int = 8081
    metrics_enabled: bool = True
    
    # Schema
    schema_directory: str = "./schemas"
    schema_cache_ttl: int = 300
    
    # Quarantine
    quarantine_enabled: bool = True
    quarantine_retention_days: int = 30
    quarantine_auto_delete: bool = True
    quarantine_batch_size: int = 100
    
    # Validation
    validation_timeout_seconds: int = 5
    validation_max_retries: int = 3
    enable_auto_remediation: bool = True
    
    # Performance
    max_concurrent_validations: int = 100
    batch_processing_enabled: bool = True
    batch_size: int = 50
    batch_timeout_ms: int = 1000
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
