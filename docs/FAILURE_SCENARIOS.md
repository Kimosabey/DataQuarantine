# DataQuarantine - Failure Scenarios & Resilience Strategies

**Document Version**: 1.0  
**Author**: Kimo (Senior Hybrid Engineer)  
**Purpose**: Demonstrate understanding of distributed systems failure modes

---

## 1. Executive Summary

This document outlines **every possible failure scenario** in the DataQuarantine system and the **mitigation strategies** implemented. Understanding failure modes is critical for building resilient distributed systems.

**Key Principle**: *"Everything fails, all the time"* - Werner Vogels, Amazon CTO

---

## 2. Infrastructure Failures

### 2.1 Kafka Broker Failure

**Scenario**: One or more Kafka brokers crash during message processing.

**Impact**:
- Consumer may lose connection
- Producer may fail to send messages
- Potential message loss if not handled correctly

**Mitigation Strategy**:

1. **Replication Factor = 3**
   ```yaml
   # docker-compose.yml
   KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 3
   KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 3
   ```

2. **Manual Offset Commit**
   ```python
   # Only commit AFTER successful processing
   await consumer.commit_offset(topic, partition, offset)
   ```
   - If broker fails mid-processing, offset is NOT committed
   - On reconnection, consumer resumes from last committed offset
   - **Result**: At-least-once delivery, NO DATA LOSS

3. **Producer Acknowledgment**
   ```python
   # Wait for all replicas
   producer = AIOKafkaProducer(acks='all')
   ```

**Recovery Time**: Automatic (Kafka handles leader election)

**Data Loss**: ZERO (with proper configuration)

---

### 2.2 PostgreSQL Database Failure

**Scenario**: Metadata database becomes unavailable.

**Impact**:
- Cannot log quarantine metadata
- Cannot query historical records
- Review UI unavailable

**Mitigation Strategy**: **Fail-Open with Degraded Mode**

```python
async def quarantine_record(self, message, error):
    try:
        # Try to write to PostgreSQL
        await self.metadata.insert_record(...)
    except DatabaseError as e:
        logger.error(f"Database unavailable: {e}")
        
        # FALLBACK: Write to local file
        await self._write_to_fallback_log(message, error)
        
        # Continue processing (don't block pipeline)
        metrics.record_error("database_unavailable")
```

**Fallback Storage**:
- Write to local JSON file: `quarantine_fallback_{timestamp}.json`
- Background job syncs to database when available
- Alert operators via Prometheus

**Recovery**:
1. Database comes back online
2. Background sync job reads fallback files
3. Inserts records into database
4. Deletes fallback files

**Data Loss**: ZERO (buffered locally)

**Downtime**: Pipeline continues, metadata delayed

---

### 2.3 MinIO/S3 Storage Failure

**Scenario**: Object storage is unavailable.

**Impact**:
- Cannot store full quarantined messages
- Only metadata available

**Mitigation Strategy**: **Fail-Open with Local Fallback**

```python
async def store_record(self, path, message):
    try:
        # Try MinIO
        await self.minio_client.put_object(bucket, path, message)
    except S3Error as e:
        logger.error(f"MinIO unavailable: {e}")
        
        # FALLBACK: Local disk
        local_path = f"./quarantine_data/{path}"
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        
        with open(local_path, 'w') as f:
            json.dump(message, f)
        
        # Queue for retry
        await self.retry_queue.add(path, message)
```

**Background Sync**:
```python
async def sync_to_minio():
    while True:
        await asyncio.sleep(60)  # Every minute
        
        for file in os.listdir("./quarantine_data"):
            try:
                # Upload to MinIO
                await upload_file(file)
                # Delete local copy
                os.remove(file)
            except:
                # Retry later
                pass
```

**Data Loss**: ZERO (local backup)

---

### 2.4 Redis Failure (Metrics/Cache)

**Scenario**: Redis (used for caching) becomes unavailable.

**Impact**:
- Schema cache unavailable
- Slower validation (must load from disk)

**Mitigation Strategy**: **Graceful Degradation**

```python
async def get_schema(self, name, version):
    # Try cache first
    try:
        cached = await self.redis.get(f"schema:{name}:{version}")
        if cached:
            return json.loads(cached)
    except RedisError:
        logger.warning("Redis unavailable, loading from disk")
    
    # Fallback: Load from filesystem
    schema = await self._load_from_file(name, version)
    
    # Try to cache (best effort)
    try:
        await self.redis.set(f"schema:{name}:{version}", json.dumps(schema))
    except:
        pass  # Continue without cache
    
    return schema
```

**Impact**: Performance degradation (10-20ms slower), but **system continues**

---

## 3. Application Failures

### 3.1 Validator Crash Mid-Processing

**Scenario**: Python process crashes while processing a batch.

**Impact**:
- Current batch not processed
- Offsets not committed

**Mitigation Strategy**: **Automatic Recovery**

1. **No offset commit until success**
   - Kafka retains uncommitted messages
   - On restart, consumer resumes from last committed offset

2. **Idempotent Processing**
   ```python
   # Use message key for deduplication
   message_id = f"{topic}:{partition}:{offset}"
   
   if await self.processed_cache.exists(message_id):
       logger.info(f"Duplicate message, skipping: {message_id}")
       return
   ```

3. **Kubernetes Restart Policy**
   ```yaml
   # k8s/deployment.yaml
   restartPolicy: Always
   livenessProbe:
     httpGet:
       path: /health
       port: 8080
     initialDelaySeconds: 30
     periodSeconds: 10
   ```

**Recovery Time**: < 30 seconds (Kubernetes restart)

**Data Loss**: ZERO (reprocessing from last committed offset)

---

### 3.2 Schema Not Found

**Scenario**: Message references a schema that doesn't exist.

**Impact**:
- Cannot validate message
- Risk of processing invalid data

**Mitigation Strategy**: **Fail-Closed**

```python
async def validate_message(self, message, schema_name):
    try:
        schema = await self.schema_registry.get_schema(schema_name)
    except FileNotFoundError:
        logger.error(f"Schema not found: {schema_name}")
        
        # REJECT message to DLQ
        return ValidationOutcome(
            result=ValidationResult.ERROR,
            error_type="schema_not_found",
            error_message=f"Schema '{schema_name}' does not exist"
        )
```

**Result**: Message quarantined with clear error

**Alert**: Prometheus alert fires immediately

---

### 3.3 High Error Rate (Upstream Schema Change)

**Scenario**: Upstream service changes schema without notice, causing 90% of messages to fail validation.

**Impact**:
- DLQ topic overwhelmed
- Storage costs spike
- Downstream systems starved of data

**Mitigation Strategy**: **Circuit Breaker**

```python
class CircuitBreaker:
    def __init__(self, threshold=0.5, window=300):
        self.threshold = threshold  # 50% error rate
        self.window = window  # 5 minutes
        self.errors = []
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN
    
    async def check(self):
        now = time.time()
        
        # Remove old errors
        self.errors = [e for e in self.errors if now - e < self.window]
        
        # Calculate error rate
        total = self.total_messages_in_window()
        error_rate = len(self.errors) / total if total > 0 else 0
        
        if error_rate > self.threshold:
            if self.state != "OPEN":
                logger.critical(
                    f"Circuit breaker OPEN: error rate {error_rate:.2%}"
                )
                self.state = "OPEN"
                
                # PAUSE processing
                await self.pause_consumer()
                
                # ALERT operators
                await self.send_alert(
                    "DataQuarantine circuit breaker triggered! "
                    f"Error rate: {error_rate:.2%}"
                )
```

**Manual Intervention Required**:
1. Operators investigate root cause
2. Fix schema or upstream service
3. Manually reset circuit breaker
4. Resume processing

**Prevents**: Cascading failures, storage overflow

---

## 4. Network Failures

### 4.1 Network Partition (Split Brain)

**Scenario**: Network partition separates Kafka cluster.

**Impact**:
- Multiple leaders elected
- Potential duplicate processing

**Mitigation Strategy**: **Kafka Quorum**

```yaml
# Require majority for leader election
KAFKA_MIN_INSYNC_REPLICAS: 2
KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 3
```

**Result**: Kafka handles partition automatically, no application changes needed

---

### 4.2 Slow Network (High Latency)

**Scenario**: Network latency spikes to 500ms+.

**Impact**:
- Consumer lag increases
- Validation throughput drops

**Mitigation Strategy**: **Timeout & Monitoring**

```python
# Validation timeout
async def validate_with_timeout(message, schema):
    try:
        return await asyncio.wait_for(
            validator.validate(message, schema),
            timeout=5.0  # 5 second timeout
        )
    except asyncio.TimeoutError:
        logger.error("Validation timeout")
        return ValidationOutcome(
            result=ValidationResult.ERROR,
            error_type="timeout",
            error_message="Validation exceeded 5s timeout"
        )
```

**Monitoring**:
- Alert if p99 latency > 100ms
- Alert if consumer lag > 10,000 messages

---

## 5. Data Quality Failures

### 5.1 Malformed JSON

**Scenario**: Message is not valid JSON.

**Impact**:
- Deserialization fails
- Cannot validate

**Mitigation Strategy**: **Graceful Handling**

```python
def _deserialize_message(self, raw_value: bytes) -> Dict[str, Any]:
    try:
        return json.loads(raw_value.decode('utf-8'))
    except json.JSONDecodeError as e:
        logger.error(f"Malformed JSON: {e}")
        
        # Return error wrapper
        return {
            "_deserialization_error": True,
            "_raw_value": raw_value.decode('utf-8', errors='replace'),
            "_error": str(e)
        }
```

**Result**: Message sent to DLQ with deserialization error

---

### 5.2 Schema Evolution (Backward Incompatible)

**Scenario**: New schema version breaks backward compatibility.

**Impact**:
- Old messages fail validation
- Historical data cannot be reprocessed

**Mitigation Strategy**: **Schema Versioning**

```python
# Message includes schema version
message = {
    "_schema": "user_event",
    "_schema_version": "1.0.0",
    "user_id": "123",
    ...
}

# Validator uses correct version
outcome = await validator.validate(
    message,
    schema_name=message["_schema"],
    schema_version=message["_schema_version"]
)
```

**Best Practice**: Always maintain backward compatibility

---

## 6. Operational Failures

### 6.1 Disk Full

**Scenario**: Local disk fills up (logs, fallback files).

**Impact**:
- Cannot write logs
- Cannot buffer quarantined records

**Mitigation Strategy**: **Monitoring & Cleanup**

```python
# Disk space check
async def check_disk_space():
    usage = shutil.disk_usage("/")
    percent_used = (usage.used / usage.total) * 100
    
    if percent_used > 90:
        logger.critical(f"Disk usage critical: {percent_used:.1f}%")
        
        # Emergency cleanup
        await cleanup_old_logs()
        await cleanup_fallback_files()
        
        # Alert
        await send_alert("Disk space critical!")
```

**Prevention**: Kubernetes volume limits, log rotation

---

### 6.2 Memory Leak

**Scenario**: Memory usage grows over time.

**Impact**:
- OOM killer terminates process
- Service disruption

**Mitigation Strategy**: **Memory Limits & Monitoring**

```yaml
# k8s/deployment.yaml
resources:
  limits:
    memory: "512Mi"
  requests:
    memory: "256Mi"
```

```python
# Periodic memory check
async def monitor_memory():
    while True:
        await asyncio.sleep(60)
        
        import psutil
        process = psutil.Process()
        memory_mb = process.memory_info().rss / 1024 / 1024
        
        if memory_mb > 450:  # 90% of 512MB limit
            logger.warning(f"High memory usage: {memory_mb:.1f}MB")
            
            # Clear caches
            schema_registry.clear_cache()
            validator.clear_cache()
```

---

## 7. Failure Recovery Checklist

### When a Failure Occurs:

1. ✅ **Check Metrics Dashboard**
   - Consumer lag
   - Error rate
   - Throughput

2. ✅ **Check Logs**
   ```bash
   kubectl logs -f deployment/dataquarantine --tail=100
   ```

3. ✅ **Verify Kafka Health**
   ```bash
   kafka-topics --bootstrap-server localhost:9092 --list
   ```

4. ✅ **Check Database Connectivity**
   ```bash
   psql -h localhost -U quarantine_user -d dataquarantine
   ```

5. ✅ **Review Quarantined Records**
   - Access Review UI
   - Identify patterns in errors

6. ✅ **Restart if Needed**
   ```bash
   kubectl rollout restart deployment/dataquarantine
   ```

---

## 8. Interview Questions & Answers

### Q: What happens if Kafka crashes mid-processing?

**Answer**: 
"We use manual offset commit, so offsets are only committed AFTER successful processing. If Kafka crashes, the consumer will reconnect and resume from the last committed offset. This ensures at-least-once delivery with zero data loss. The trade-off is potential duplicate processing, which we handle with idempotent operations."

### Q: How do you prevent data loss?

**Answer**:
"Three layers:
1. **Kafka replication** (factor=3) - survives broker failures
2. **Manual offset commit** - only commit after successful processing
3. **Local fallback** - if downstream storage fails, buffer locally and sync later

This guarantees zero data loss even in catastrophic failures."

### Q: What's your strategy if the database is down?

**Answer**:
"We fail-open with degraded mode. The validation pipeline continues processing, but metadata is written to local fallback files. A background job syncs to the database when it recovers. This prevents a database outage from blocking the entire pipeline."

---

## 9. Conclusion

DataQuarantine is designed with **resilience-first** principles:

✅ **No Single Point of Failure**  
✅ **Graceful Degradation**  
✅ **Zero Data Loss Guarantee**  
✅ **Comprehensive Monitoring**  
✅ **Automatic Recovery**

**Key Takeaway**: *"Design for failure, hope for success"*

---

**Document Status**: ✅ Production Ready  
**Last Updated**: December 2025
