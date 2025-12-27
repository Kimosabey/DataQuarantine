# DataQuarantine - High-Level Design (HLD)

**Document Version**: 1.0  
**Author**: Kimo (Senior Hybrid Engineer)  
**Date**: December 2025  
**Status**: Active Development

---

## 1. Executive Summary

**DataQuarantine** is a streaming schema enforcement system that validates real-time data streams, quarantines invalid records, and provides observability into data quality. It implements the **Dead Letter Queue (DLQ)** pattern to ensure data reliability and governance.

### 1.1 Business Problem

In production streaming pipelines:
- **Bad data corrupts downstream systems** (analytics, ML models, dashboards)
- **Schema violations go undetected** until they cause failures
- **No centralized data quality governance**
- **Debugging invalid data is time-consuming**

### 1.2 Solution

A **real-time validation gateway** that:
1. Validates every message against a schema
2. Routes valid messages to clean topics
3. Quarantines invalid messages to DLQ
4. Provides metrics and alerting
5. Enables reprocessing after fixes

---

## 2. System Architecture

### 2.1 High-Level Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA PRODUCERS                            │
│              (IoT Devices, APIs, Microservices)                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │   Kafka: raw-events Topic     │
         │   (Unvalidated Stream)        │
         └───────────┬───────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────┐
│              DATAQUARANTINE VALIDATOR ENGINE                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Consumer Group: dataquarantine-validators               │  │
│  │  - Parallel Processing (Configurable Workers)            │  │
│  │  - Schema Registry Integration                           │  │
│  │  - Pydantic/JSON Schema Validation                       │  │
│  └──────────────────┬───────────────────────────────────────┘  │
│                     │                                           │
│         ┌───────────┴──────────┐                                │
│         │                      │                                │
│         ▼                      ▼                                │
│   ┌──────────┐          ┌──────────────┐                        │
│   │  VALID   │          │   INVALID    │                        │
│   │ Records  │          │   Records    │                        │
│   └────┬─────┘          └──────┬───────┘                        │
└────────┼────────────────────────┼────────────────────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐      ┌──────────────────────────────┐
│ Kafka: Valid    │      │  Kafka: DLQ Topic            │
│ Topic           │      │  + MinIO Storage             │
│ (Clean Data)    │      │  + PostgreSQL Metadata       │
└────────┬────────┘      └──────────┬───────────────────┘
         │                          │
         ▼                          ▼
┌─────────────────┐      ┌──────────────────────────────┐
│ Downstream      │      │  Quarantine Review UI        │
│ Consumers       │      │  - View Invalid Records      │
│ (Analytics, ML) │      │  - Edit & Revalidate         │
└─────────────────┘      │  - Batch Reprocessing        │
                         └──────────────────────────────┘
```

### 2.2 Data Flow

1. **Ingestion**: Producers write to `raw-events` topic
2. **Consumption**: Validator consumes messages in batches
3. **Validation**: Each message validated against schema
4. **Routing**:
   - **Valid**: Produce to `validated-events` topic
   - **Invalid**: Produce to `quarantine-dlq` topic + Store in MinIO + Log metadata in PostgreSQL
5. **Monitoring**: Emit Prometheus metrics
6. **Alerting**: Trigger alerts if error rate exceeds threshold

---

## 3. Component Design

### 3.1 Validator Engine

**Responsibility**: Core validation logic

**Key Classes**:
- `SchemaValidator`: Abstract base for validators
- `JSONSchemaValidator`: JSON Schema validation
- `AvroValidator`: Avro schema validation
- `PydanticValidator`: Pydantic model validation
- `CustomRuleValidator`: Business rule validation

**Validation Pipeline**:
```python
Message → Schema Validation → Custom Rules → Auto-Remediation → Output
```

### 3.2 Quarantine Manager

**Responsibility**: Handle invalid records

**Operations**:
- Store invalid record in MinIO (blob storage)
- Log metadata in PostgreSQL (searchable index)
- Emit metrics
- Trigger alerts

**Metadata Schema**:
```sql
CREATE TABLE quarantine_records (
    id UUID PRIMARY KEY,
    topic VARCHAR(255),
    partition INT,
    offset BIGINT,
    timestamp TIMESTAMP,
    schema_name VARCHAR(255),
    schema_version VARCHAR(50),
    error_type VARCHAR(100),
    error_message TEXT,
    storage_path VARCHAR(500),
    status VARCHAR(50), -- 'quarantined', 'reprocessed', 'deleted'
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.3 Schema Registry

**Responsibility**: Manage schema versions

**Features**:
- Load schemas from filesystem
- Cache schemas in memory (with TTL)
- Support schema evolution
- Backward compatibility checks

**Schema Format**:
```yaml
version: "1.0.0"
name: "user_event"
type: "json_schema"
schema:
  type: object
  properties:
    user_id: {type: string}
    timestamp: {type: string, format: date-time}
  required: [user_id, timestamp]
```

### 3.4 Metrics & Monitoring

**Prometheus Metrics**:
- `dataquarantine_records_processed_total{topic, schema}`
- `dataquarantine_records_valid_total{topic, schema}`
- `dataquarantine_records_invalid_total{topic, schema, error_type}`
- `dataquarantine_validation_duration_seconds{schema}`
- `dataquarantine_kafka_lag{topic, partition}`

---

## 4. Failure Scenarios & Resilience

### 4.1 Kafka Broker Failure

**Scenario**: Kafka broker goes down mid-processing

**Mitigation**:
- Consumer uses manual offset commit (after successful processing)
- Replication factor = 3 for all topics
- Consumer will reconnect and resume from last committed offset
- **No data loss**

### 4.2 PostgreSQL Failure

**Scenario**: Metadata database is unavailable

**Strategy**: **Fail-Open with Degraded Mode**
- Continue validation and routing
- Buffer metadata writes in memory (max 10,000 records)
- Retry writes with exponential backoff
- If buffer full, log to local file
- **System continues processing, metadata may be delayed**

### 4.3 MinIO Failure

**Scenario**: Object storage is unavailable

**Strategy**: **Fail-Open with Local Fallback**
- Write quarantined records to local disk
- Background job syncs to MinIO when available
- Alert operators
- **No data loss, temporary local storage**

### 4.4 Schema Registry Failure

**Scenario**: Cannot load schema

**Strategy**: **Fail-Closed**
- Use cached schema (if available)
- If no cache, **reject all messages** to DLQ with error "Schema unavailable"
- Alert operators immediately
- **Prevents processing with unknown schema**

### 4.5 High Error Rate

**Scenario**: Sudden spike in invalid records (e.g., upstream schema change)

**Mitigation**:
- Circuit breaker: If error rate > 50% for 5 minutes, alert and pause processing
- Prevent DLQ topic from overwhelming storage
- Require manual intervention to resume

---

## 5. Scalability & Performance

### 5.1 Horizontal Scaling

- **Validator Instances**: Deploy multiple instances (Kubernetes pods)
- **Consumer Group**: Kafka automatically balances partitions across instances
- **Throughput**: Linear scaling with partition count

**Example**:
- 10 partitions × 3 instances = ~30,000 msgs/sec (at 1ms validation time)

### 5.2 Performance Optimizations

1. **Batch Processing**: Consume 500 messages per poll
2. **Async I/O**: Use `aiokafka` for non-blocking I/O
3. **Schema Caching**: In-memory cache (5-minute TTL)
4. **Connection Pooling**: PostgreSQL connection pool (20 connections)
5. **Parallel Validation**: Process batch in parallel using `asyncio.gather()`

---

## 6. Security & Compliance

### 6.1 Data Privacy

- **PII Masking**: Optional field-level encryption for sensitive data
- **Retention Policy**: Auto-delete quarantined records after 30 days
- **Access Control**: Role-based access to Review UI

### 6.2 Audit Trail

- Every validation logged with:
  - Timestamp
  - Schema version
  - Validation result
  - Error details
- Immutable audit log for compliance

---

## 7. Technology Choices & Justification

| Component | Technology | Justification |
|-----------|-----------|---------------|
| **Streaming** | Kafka/Redpanda | Industry standard, high throughput, consumer groups |
| **Validation** | Pydantic + jsonschema | Type-safe, fast, extensible |
| **Metadata DB** | PostgreSQL | ACID compliance, rich querying, proven reliability |
| **Object Storage** | MinIO | S3-compatible, self-hosted, cost-effective |
| **Metrics** | Prometheus | Pull-based, integrates with Grafana, standard |
| **API** | FastAPI | Async, auto-docs, high performance |
| **Language** | Python 3.11+ | Rich ecosystem, async support, readability |

---

## 8. Deployment Architecture

### 8.1 Local Development (Docker Compose)

```
docker-compose up
```

Runs:
- Kafka + Zookeeper
- PostgreSQL
- MinIO
- Prometheus + Grafana
- DataQuarantine API

### 8.2 Production (Kubernetes)

```
kubectl apply -f k8s/
```

Components:
- **Deployment**: `dataquarantine-validator` (3 replicas)
- **Service**: `dataquarantine-api` (LoadBalancer)
- **ConfigMap**: Schema definitions
- **Secret**: Database credentials
- **HPA**: Auto-scale based on CPU (50-80%)

---

## 9. Success Metrics

### 9.1 System Metrics

- **Throughput**: > 10,000 msgs/sec per instance
- **Latency**: p99 validation time < 10ms
- **Availability**: 99.9% uptime
- **Data Loss**: 0% (guaranteed by Kafka offset management)

### 9.2 Business Metrics

- **Data Quality**: % of valid records (target: > 95%)
- **MTTR**: Mean time to resolve quarantined records (target: < 4 hours)
- **Schema Compliance**: % of producers using latest schema (target: > 90%)

---

## 10. Future Enhancements

1. **ML-Based Anomaly Detection**: Auto-detect schema drift
2. **Multi-Tenancy**: Isolated validation per team
3. **Real-Time Dashboard**: WebSocket-based live monitoring
4. **Auto-Remediation**: AI-powered data correction
5. **Schema Suggestion**: Infer schema from data samples

---

## 11. Conclusion

DataQuarantine provides **production-grade data governance** for streaming pipelines. It implements industry-standard patterns (DLQ, Circuit Breaker) and is designed for **resilience, scalability, and observability**.

**Key Differentiators**:
- ✅ Atomic offset management (no data loss)
- ✅ Fail-open strategies (graceful degradation)
- ✅ Comprehensive metrics (full observability)
- ✅ Self-hosted (no vendor lock-in)

---

**Document Status**: ✅ Approved for Implementation  
**Next Steps**: Proceed to Low-Level Design (LLD)
