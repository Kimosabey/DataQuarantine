# DataQuarantine - Low-Level Design (LLD)

**Document Version**: 1.0  
**Author**: Kimo (Senior Hybrid Engineer)  
**Date**: December 2025  
**Status**: Active Development

---

## 1. Module Breakdown

### 1.1 Directory Structure

```
dataquarantine/
├── __init__.py
├── main.py                      # Application entry point
├── config/
│   ├── __init__.py
│   ├── settings.py              # Pydantic settings management
│   └── logging_config.py        # Structured logging setup
├── core/
│   ├── __init__.py
│   ├── validator_engine.py      # Core validation orchestration
│   ├── schema_registry.py       # Schema loading and caching
│   └── metrics.py               # Prometheus metrics
├── validators/
│   ├── __init__.py
│   ├── base.py                  # Abstract validator interface
│   ├── json_schema.py           # JSON Schema validator
│   ├── avro.py                  # Avro validator
│   ├── pydantic.py              # Pydantic model validator
│   └── custom_rules.py          # Business rule validator
├── quarantine/
│   ├── __init__.py
│   ├── manager.py               # Quarantine record management
│   ├── storage.py               # MinIO/S3 integration
│   └── metadata.py              # PostgreSQL metadata operations
├── streaming/
│   ├── __init__.py
│   ├── kafka_consumer.py        # Kafka consumer wrapper
│   ├── kafka_producer.py        # Kafka producer wrapper
│   └── message.py               # Message models
├── api/
│   ├── __init__.py
│   ├── app.py                   # FastAPI application
│   ├── routes/
│   │   ├── health.py            # Health check endpoints
│   │   ├── quarantine.py        # Quarantine CRUD endpoints
│   │   ├── schemas.py           # Schema management endpoints
│   │   └── metrics.py           # Metrics endpoints
│   └── models/
│       ├── requests.py          # API request models
│       └── responses.py         # API response models
├── remediation/
│   ├── __init__.py
│   ├── rules.py                 # Auto-remediation rules
│   └── engine.py                # Remediation execution
└── utils/
    ├── __init__.py
    ├── database.py              # Database connection pool
    ├── storage_client.py        # MinIO client
    └── helpers.py               # Utility functions
```

---

## 2. Core Classes & Interfaces

### 2.1 Validator Engine

**File**: `core/validator_engine.py`

```python
from abc import ABC, abstractmethod
from typing import Tuple, Optional, Dict, Any
from dataclasses import dataclass
from enum import Enum

class ValidationResult(Enum):
    VALID = "valid"
    INVALID = "invalid"
    ERROR = "error"

@dataclass
class ValidationOutcome:
    result: ValidationResult
    error_type: Optional[str] = None
    error_message: Optional[str] = None
    remediated: bool = False
    metadata: Dict[str, Any] = None

class ValidatorEngine:
    """
    Orchestrates validation pipeline:
    1. Load schema
    2. Run validators
    3. Apply remediation
    4. Emit metrics
    """
    
    def __init__(
        self,
        schema_registry: SchemaRegistry,
        validators: List[BaseValidator],
        remediation_engine: Optional[RemediationEngine] = None,
        metrics_collector: MetricsCollector
    ):
        self.schema_registry = schema_registry
        self.validators = validators
        self.remediation_engine = remediation_engine
        self.metrics = metrics_collector
    
    async def validate_message(
        self,
        message: Dict[str, Any],
        schema_name: str,
        schema_version: str = "latest"
    ) -> ValidationOutcome:
        """
        Main validation entry point.
        
        Returns:
            ValidationOutcome with result and error details
        """
        start_time = time.time()
        
        try:
            # 1. Load schema
            schema = await self.schema_registry.get_schema(
                schema_name, schema_version
            )
            
            # 2. Run validators
            for validator in self.validators:
                is_valid, error = await validator.validate(message, schema)
                if not is_valid:
                    # 3. Try remediation
                    if self.remediation_engine:
                        remediated_msg = await self.remediation_engine.remediate(
                            message, error
                        )
                        if remediated_msg:
                            # Re-validate
                            is_valid, _ = await validator.validate(
                                remediated_msg, schema
                            )
                            if is_valid:
                                return ValidationOutcome(
                                    result=ValidationResult.VALID,
                                    remediated=True,
                                    metadata={"original": message}
                                )
                    
                    # 4. Return invalid
                    self.metrics.record_invalid(schema_name, error.type)
                    return ValidationOutcome(
                        result=ValidationResult.INVALID,
                        error_type=error.type,
                        error_message=error.message
                    )
            
            # All validators passed
            self.metrics.record_valid(schema_name)
            return ValidationOutcome(result=ValidationResult.VALID)
            
        except Exception as e:
            self.metrics.record_error(schema_name, str(e))
            return ValidationOutcome(
                result=ValidationResult.ERROR,
                error_type="system_error",
                error_message=str(e)
            )
        finally:
            duration = time.time() - start_time
            self.metrics.record_duration(schema_name, duration)
```

### 2.2 Base Validator Interface

**File**: `validators/base.py`

```python
from abc import ABC, abstractmethod
from typing import Tuple, Optional, Dict, Any
from dataclasses import dataclass

@dataclass
class ValidationError:
    type: str
    message: str
    field_path: Optional[str] = None
    expected: Optional[Any] = None
    actual: Optional[Any] = None

class BaseValidator(ABC):
    """Abstract base class for all validators"""
    
    @abstractmethod
    async def validate(
        self,
        message: Dict[str, Any],
        schema: Dict[str, Any]
    ) -> Tuple[bool, Optional[ValidationError]]:
        """
        Validate a message against a schema.
        
        Args:
            message: The message to validate
            schema: The schema definition
            
        Returns:
            Tuple of (is_valid, error)
            - is_valid: True if valid, False otherwise
            - error: ValidationError if invalid, None if valid
        """
        pass
    
    @property
    @abstractmethod
    def validator_name(self) -> str:
        """Return the name of this validator"""
        pass
```

### 2.3 JSON Schema Validator

**File**: `validators/json_schema.py`

```python
import jsonschema
from jsonschema import Draft7Validator, ValidationError as JSValidationError
from typing import Tuple, Optional, Dict, Any

from .base import BaseValidator, ValidationError

class JSONSchemaValidator(BaseValidator):
    """Validates messages using JSON Schema (Draft 7)"""
    
    def __init__(self):
        self._validator_cache = {}
    
    async def validate(
        self,
        message: Dict[str, Any],
        schema: Dict[str, Any]
    ) -> Tuple[bool, Optional[ValidationError]]:
        try:
            # Get or create validator
            schema_id = schema.get("$id", "default")
            if schema_id not in self._validator_cache:
                self._validator_cache[schema_id] = Draft7Validator(schema)
            
            validator = self._validator_cache[schema_id]
            
            # Validate
            errors = list(validator.iter_errors(message))
            
            if errors:
                # Return first error
                error = errors[0]
                return False, ValidationError(
                    type="schema_violation",
                    message=error.message,
                    field_path=".".join(str(p) for p in error.path),
                    expected=error.schema.get("type"),
                    actual=type(error.instance).__name__
                )
            
            return True, None
            
        except Exception as e:
            return False, ValidationError(
                type="validation_error",
                message=f"JSON Schema validation failed: {str(e)}"
            )
    
    @property
    def validator_name(self) -> str:
        return "json_schema"
```

---

## 3. Kafka Integration

### 3.1 Consumer Implementation

**File**: `streaming/kafka_consumer.py`

```python
from aiokafka import AIOKafkaConsumer
from typing import AsyncIterator, Dict, Any
import json
import logging

logger = logging.getLogger(__name__)

class KafkaMessageConsumer:
    """
    Async Kafka consumer with manual offset management.
    
    Key Features:
    - Manual offset commit (after successful processing)
    - Batch consumption
    - Error handling with retry
    """
    
    def __init__(
        self,
        bootstrap_servers: str,
        topic: str,
        group_id: str,
        max_poll_records: int = 500,
        auto_offset_reset: str = "earliest"
    ):
        self.bootstrap_servers = bootstrap_servers
        self.topic = topic
        self.group_id = group_id
        self.max_poll_records = max_poll_records
        self.auto_offset_reset = auto_offset_reset
        self.consumer: Optional[AIOKafkaConsumer] = None
    
    async def start(self):
        """Initialize and start the consumer"""
        self.consumer = AIOKafkaConsumer(
            self.topic,
            bootstrap_servers=self.bootstrap_servers,
            group_id=self.group_id,
            enable_auto_commit=False,  # Manual commit
            auto_offset_reset=self.auto_offset_reset,
            max_poll_records=self.max_poll_records,
            value_deserializer=lambda m: json.loads(m.decode('utf-8'))
        )
        await self.consumer.start()
        logger.info(f"Kafka consumer started for topic: {self.topic}")
    
    async def consume_batch(self) -> AsyncIterator[Dict[str, Any]]:
        """
        Consume messages in batches.
        
        Yields:
            Message dict with keys: value, topic, partition, offset
        """
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
            logger.error(f"Error consuming messages: {e}")
            raise
    
    async def commit_offset(self, topic: str, partition: int, offset: int):
        """
        Manually commit offset after successful processing.
        
        This ensures at-least-once delivery semantics.
        """
        try:
            tp = TopicPartition(topic, partition)
            await self.consumer.commit({tp: offset + 1})
            logger.debug(f"Committed offset {offset} for {topic}:{partition}")
        except Exception as e:
            logger.error(f"Failed to commit offset: {e}")
            raise
    
    async def stop(self):
        """Stop the consumer"""
        if self.consumer:
            await self.consumer.stop()
            logger.info("Kafka consumer stopped")
```

### 3.2 Producer Implementation

**File**: `streaming/kafka_producer.py`

```python
from aiokafka import AIOKafkaProducer
from typing import Dict, Any, Optional
import json
import logging

logger = logging.getLogger(__name__)

class KafkaMessageProducer:
    """
    Async Kafka producer with retry logic.
    """
    
    def __init__(
        self,
        bootstrap_servers: str,
        acks: str = "all",  # Wait for all replicas
        retries: int = 3
    ):
        self.bootstrap_servers = bootstrap_servers
        self.acks = acks
        self.retries = retries
        self.producer: Optional[AIOKafkaProducer] = None
    
    async def start(self):
        """Initialize and start the producer"""
        self.producer = AIOKafkaProducer(
            bootstrap_servers=self.bootstrap_servers,
            acks=self.acks,
            retries=self.retries,
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
        await self.producer.start()
        logger.info("Kafka producer started")
    
    async def send_message(
        self,
        topic: str,
        value: Dict[str, Any],
        key: Optional[str] = None
    ) -> bool:
        """
        Send a message to Kafka topic.
        
        Returns:
            True if successful, False otherwise
        """
        try:
            key_bytes = key.encode('utf-8') if key else None
            await self.producer.send_and_wait(topic, value=value, key=key_bytes)
            logger.debug(f"Sent message to {topic}")
            return True
        except Exception as e:
            logger.error(f"Failed to send message to {topic}: {e}")
            return False
    
    async def stop(self):
        """Stop the producer"""
        if self.producer:
            await self.producer.stop()
            logger.info("Kafka producer stopped")
```

---

## 4. Quarantine Manager

**File**: `quarantine/manager.py`

```python
from typing import Dict, Any, Optional
from uuid import uuid4
from datetime import datetime
import logging

from .storage import QuarantineStorage
from .metadata import QuarantineMetadata
from ..core.metrics import MetricsCollector

logger = logging.getLogger(__name__)

class QuarantineManager:
    """
    Manages quarantined records:
    1. Store in MinIO
    2. Log metadata in PostgreSQL
    3. Emit metrics
    """
    
    def __init__(
        self,
        storage: QuarantineStorage,
        metadata: QuarantineMetadata,
        metrics: MetricsCollector
    ):
        self.storage = storage
        self.metadata = metadata
        self.metrics = metrics
    
    async def quarantine_record(
        self,
        message: Dict[str, Any],
        topic: str,
        partition: int,
        offset: int,
        schema_name: str,
        schema_version: str,
        error_type: str,
        error_message: str
    ) -> str:
        """
        Quarantine an invalid record.
        
        Returns:
            Quarantine record ID (UUID)
        """
        record_id = str(uuid4())
        timestamp = datetime.utcnow()
        
        try:
            # 1. Store in MinIO
            storage_path = f"{topic}/{partition}/{offset}_{record_id}.json"
            await self.storage.store_record(storage_path, message)
            
            # 2. Log metadata
            await self.metadata.insert_record(
                record_id=record_id,
                topic=topic,
                partition=partition,
                offset=offset,
                timestamp=timestamp,
                schema_name=schema_name,
                schema_version=schema_version,
                error_type=error_type,
                error_message=error_message,
                storage_path=storage_path
            )
            
            # 3. Emit metrics
            self.metrics.record_quarantined(topic, schema_name, error_type)
            
            logger.info(f"Quarantined record {record_id} from {topic}:{partition}:{offset}")
            return record_id
            
        except Exception as e:
            logger.error(f"Failed to quarantine record: {e}")
            # Fallback: log to local file
            await self._fallback_log(record_id, message, error_message)
            raise
    
    async def _fallback_log(self, record_id: str, message: Dict, error: str):
        """Fallback logging when storage/DB fails"""
        with open(f"quarantine_fallback_{record_id}.json", "w") as f:
            json.dump({"message": message, "error": error}, f)
```

---

## 5. API Endpoints

### 5.1 Quarantine CRUD

**File**: `api/routes/quarantine.py`

```python
from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from datetime import datetime

from ..models.responses import QuarantineRecordResponse, PaginatedResponse
from ...quarantine.metadata import QuarantineMetadata

router = APIRouter(prefix="/api/v1/quarantine", tags=["quarantine"])

@router.get("/records", response_model=PaginatedResponse[QuarantineRecordResponse])
async def list_quarantine_records(
    topic: Optional[str] = None,
    schema_name: Optional[str] = None,
    error_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=1000)
):
    """
    List quarantined records with filtering.
    """
    metadata = QuarantineMetadata()
    
    records = await metadata.query_records(
        topic=topic,
        schema_name=schema_name,
        error_type=error_type,
        start_date=start_date,
        end_date=end_date,
        page=page,
        page_size=page_size
    )
    
    return PaginatedResponse(
        items=records,
        total=len(records),
        page=page,
        page_size=page_size
    )

@router.get("/records/{record_id}", response_model=QuarantineRecordResponse)
async def get_quarantine_record(record_id: str):
    """Get a specific quarantined record with full details"""
    metadata = QuarantineMetadata()
    storage = QuarantineStorage()
    
    # Get metadata
    record = await metadata.get_record(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    # Get actual message from storage
    message = await storage.retrieve_record(record.storage_path)
    
    return QuarantineRecordResponse(
        **record.dict(),
        message=message
    )

@router.post("/records/{record_id}/reprocess")
async def reprocess_record(record_id: str):
    """
    Reprocess a quarantined record.
    
    This will re-validate and send to appropriate topic.
    """
    # Implementation in next iteration
    pass
```

---

## 6. Database Schema

**File**: `scripts/init_db.sql`

```sql
-- Quarantine records table
CREATE TABLE IF NOT EXISTS quarantine_records (
    id UUID PRIMARY KEY,
    topic VARCHAR(255) NOT NULL,
    partition INTEGER NOT NULL,
    offset BIGINT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    schema_name VARCHAR(255) NOT NULL,
    schema_version VARCHAR(50) NOT NULL,
    error_type VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'quarantined',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_quarantine_topic ON quarantine_records(topic);
CREATE INDEX idx_quarantine_schema ON quarantine_records(schema_name);
CREATE INDEX idx_quarantine_error_type ON quarantine_records(error_type);
CREATE INDEX idx_quarantine_timestamp ON quarantine_records(timestamp);
CREATE INDEX idx_quarantine_status ON quarantine_records(status);

-- Schema registry table
CREATE TABLE IF NOT EXISTS schemas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    schema_type VARCHAR(50) NOT NULL,
    schema_definition JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(name, version)
);

-- Validation metrics table (for historical analysis)
CREATE TABLE IF NOT EXISTS validation_metrics (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    topic VARCHAR(255) NOT NULL,
    schema_name VARCHAR(255) NOT NULL,
    total_processed INTEGER NOT NULL,
    total_valid INTEGER NOT NULL,
    total_invalid INTEGER NOT NULL,
    avg_duration_ms FLOAT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_metrics_timestamp ON validation_metrics(timestamp);
CREATE INDEX idx_metrics_topic ON validation_metrics(topic);
```

---

## 7. Configuration Management

**File**: `config/settings.py`

```python
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """Application settings using Pydantic"""
    
    # App
    app_name: str = "DataQuarantine"
    environment: str = "development"
    log_level: str = "INFO"
    
    # Kafka
    kafka_bootstrap_servers: str
    kafka_consumer_group_id: str = "dataquarantine-validators"
    kafka_raw_topic: str = "raw-events"
    kafka_valid_topic: str = "validated-events"
    kafka_dlq_topic: str = "quarantine-dlq"
    kafka_max_poll_records: int = 500
    
    # Database
    database_url: str
    db_pool_size: int = 20
    
    # MinIO
    minio_endpoint: str
    minio_access_key: str
    minio_secret_key: str
    minio_bucket: str = "data-quarantine"
    minio_secure: bool = False
    
    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8080
    
    # Monitoring
    prometheus_port: int = 8081
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
```

---

## 8. Main Application

**File**: `main.py`

```python
import asyncio
import logging
from typing import List

from dataquarantine.config.settings import settings
from dataquarantine.core.validator_engine import ValidatorEngine
from dataquarantine.core.schema_registry import SchemaRegistry
from dataquarantine.core.metrics import MetricsCollector
from dataquarantine.validators.json_schema import JSONSchemaValidator
from dataquarantine.streaming.kafka_consumer import KafkaMessageConsumer
from dataquarantine.streaming.kafka_producer import KafkaMessageProducer
from dataquarantine.quarantine.manager import QuarantineManager

logger = logging.getLogger(__name__)

class DataQuarantineApp:
    """Main application orchestrator"""
    
    def __init__(self):
        self.consumer = None
        self.producer = None
        self.validator_engine = None
        self.quarantine_manager = None
        self.running = False
    
    async def initialize(self):
        """Initialize all components"""
        logger.info("Initializing DataQuarantine...")
        
        # Initialize Kafka
        self.consumer = KafkaMessageConsumer(
            bootstrap_servers=settings.kafka_bootstrap_servers,
            topic=settings.kafka_raw_topic,
            group_id=settings.kafka_consumer_group_id
        )
        await self.consumer.start()
        
        self.producer = KafkaMessageProducer(
            bootstrap_servers=settings.kafka_bootstrap_servers
        )
        await self.producer.start()
        
        # Initialize validator
        schema_registry = SchemaRegistry()
        validators = [JSONSchemaValidator()]
        metrics = MetricsCollector()
        
        self.validator_engine = ValidatorEngine(
            schema_registry=schema_registry,
            validators=validators,
            metrics_collector=metrics
        )
        
        # Initialize quarantine
        self.quarantine_manager = QuarantineManager(...)
        
        logger.info("DataQuarantine initialized successfully")
    
    async def process_messages(self):
        """Main processing loop"""
        self.running = True
        
        async for message in self.consumer.consume_batch():
            try:
                # Validate
                outcome = await self.validator_engine.validate_message(
                    message=message["value"],
                    schema_name="user_event",  # TODO: Get from message metadata
                    schema_version="latest"
                )
                
                # Route based on outcome
                if outcome.result == ValidationResult.VALID:
                    await self.producer.send_message(
                        topic=settings.kafka_valid_topic,
                        value=message["value"]
                    )
                else:
                    await self.quarantine_manager.quarantine_record(
                        message=message["value"],
                        topic=message["topic"],
                        partition=message["partition"],
                        offset=message["offset"],
                        schema_name="user_event",
                        schema_version="latest",
                        error_type=outcome.error_type,
                        error_message=outcome.error_message
                    )
                    
                    await self.producer.send_message(
                        topic=settings.kafka_dlq_topic,
                        value=message["value"]
                    )
                
                # Commit offset
                await self.consumer.commit_offset(
                    topic=message["topic"],
                    partition=message["partition"],
                    offset=message["offset"]
                )
                
            except Exception as e:
                logger.error(f"Error processing message: {e}")
                # Don't commit offset on error - will retry
    
    async def shutdown(self):
        """Graceful shutdown"""
        logger.info("Shutting down DataQuarantine...")
        self.running = False
        
        if self.consumer:
            await self.consumer.stop()
        if self.producer:
            await self.producer.stop()
        
        logger.info("Shutdown complete")

async def main():
    app = DataQuarantineApp()
    
    try:
        await app.initialize()
        await app.process_messages()
    except KeyboardInterrupt:
        logger.info("Received shutdown signal")
    finally:
        await app.shutdown()

if __name__ == "__main__":
    asyncio.run(main())
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

```python
# tests/unit/test_json_schema_validator.py
import pytest
from dataquarantine.validators.json_schema import JSONSchemaValidator

@pytest.mark.asyncio
async def test_valid_message():
    validator = JSONSchemaValidator()
    schema = {"type": "object", "properties": {"name": {"type": "string"}}}
    message = {"name": "John"}
    
    is_valid, error = await validator.validate(message, schema)
    
    assert is_valid is True
    assert error is None

@pytest.mark.asyncio
async def test_invalid_message():
    validator = JSONSchemaValidator()
    schema = {"type": "object", "properties": {"age": {"type": "number"}}}
    message = {"age": "not a number"}
    
    is_valid, error = await validator.validate(message, schema)
    
    assert is_valid is False
    assert error.type == "schema_violation"
```

### 9.2 Integration Tests

```python
# tests/integration/test_end_to_end.py
import pytest
from dataquarantine.main import DataQuarantineApp

@pytest.mark.asyncio
async def test_valid_message_flow(kafka_fixture, db_fixture):
    """Test that valid messages reach the valid topic"""
    app = DataQuarantineApp()
    await app.initialize()
    
    # Send test message
    await kafka_fixture.produce("raw-events", {"user_id": "123", "timestamp": "2025-01-01T00:00:00Z"})
    
    # Wait for processing
    await asyncio.sleep(1)
    
    # Verify message in valid topic
    messages = await kafka_fixture.consume("validated-events", timeout=5)
    assert len(messages) == 1
    assert messages[0]["user_id"] == "123"
```

---

## 10. Performance Benchmarks

**Target Metrics**:
- **Throughput**: 10,000 msgs/sec per instance
- **Latency**: p99 < 10ms
- **Memory**: < 512MB per instance
- **CPU**: < 50% under normal load

**Load Test Script**: `tests/performance/load_test.py`

---

**Document Status**: ✅ Ready for Implementation  
**Next Steps**: Begin coding core modules
