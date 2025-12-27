# DataQuarantine - Quick Start Guide

**Get up and running in 5 minutes!**

---

## 1. Prerequisites

- **Docker Desktop** installed and running
- **Python 3.9+** (for local development)
- **Git** (to clone the repo)
- **8GB RAM** minimum (for all services)

---

## 2. Start the Infrastructure

### Step 1: Start all services

```bash
cd DataQuarantine
docker-compose up -d
```

This will start:
- ✅ Zookeeper (Kafka coordination)
- ✅ Kafka (message broker)
- ✅ Kafka UI (visual management)
- ✅ PostgreSQL (metadata storage)
- ✅ MinIO (object storage)
- ✅ Prometheus (metrics)
- ✅ Grafana (dashboards)
- ✅ Next.js UI (modern dashboard)

### Step 2: Verify all services are running

```bash
docker-compose ps
```

Expected output:
```
NAME                          STATUS
dataquarantine-kafka          Up (healthy)
dataquarantine-kafka-ui       Up (healthy)
dataquarantine-zookeeper      Up
dataquarantine-postgres       Up (healthy)
dataquarantine-minio          Up (healthy)
dataquarantine-prometheus     Up
dataquarantine-grafana        Up
```

---

## 3. Access the UIs

### 🎯 Kafka UI (Most Important!)
- **URL**: http://localhost:8090
- **Purpose**: View topics, messages, consumer groups, lag
- **Features**:
  - Browse messages in real-time
  - Create/delete topics
  - Monitor consumer lag
  - View message schemas

**What to check**:
1. Go to **Topics** tab
2. You should see: `raw-events`, `validated-events`, `quarantine-dlq`
3. Click on a topic to see messages

---

### 🎨 Next.js Dashboard (Modern UI!)
- **URL**: http://localhost:3001
- **Purpose**: Beautiful, animated dashboard for monitoring and management
- **Features**:
  - Real-time metrics with animated charts
  - Glassmorphism design with gradients
  - Quarantine browser with filtering
  - Live system status
  - Smooth animations with Framer Motion

**What to check**:
1. **Dashboard**: View animated stat cards and charts
2. **Quarantine**: Browse and filter quarantined records
3. **System Status**: Monitor all services health

**Screenshots**:
- 📊 Animated metrics cards with gradients
- 📈 Interactive validation rate chart
- 🥧 Error breakdown pie chart
- 📋 Filterable quarantine table

---

### 📊 Grafana (Metrics Dashboard)
- **URL**: http://localhost:3000
- **Username**: `admin`
- **Password**: `admin`
- **Purpose**: Visualize validation metrics

**Dashboards**:
- DataQuarantine Overview
- Validation Rates
- Error Types
- Consumer Lag

---

### 📦 MinIO Console (Object Storage)
- **URL**: http://localhost:9001
- **Username**: `minioadmin`
- **Password**: `minioadmin`
- **Purpose**: View quarantined messages

**What to check**:
1. Go to **Buckets**
2. Click on `data-quarantine`
3. Browse quarantined messages by topic/partition

---

### 🔍 Prometheus (Raw Metrics)
- **URL**: http://localhost:9090
- **Purpose**: Query raw metrics

**Example queries**:
```promql
# Total records processed
dataquarantine_records_processed_total

# Invalid records by error type
dataquarantine_records_invalid_total

# Validation duration (p99)
histogram_quantile(0.99, dataquarantine_validation_duration_seconds_bucket)
```

---

### 🗄️ PostgreSQL (Database)
- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `dataquarantine`
- **Username**: `quarantine_user`
- **Password**: `quarantine_pass`

**Connect with psql**:
```bash
psql -h localhost -U quarantine_user -d dataquarantine
```

**Query quarantined records**:
```sql
SELECT * FROM quarantine_records ORDER BY created_at DESC LIMIT 10;
```

---

## 4. Create Kafka Topics

The topics are auto-created, but you can verify:

```bash
# List topics
docker exec -it dataquarantine-kafka kafka-topics \
  --bootstrap-server localhost:9092 \
  --list

# Expected output:
# raw-events
# validated-events
# quarantine-dlq
```

**Or use Kafka UI**: http://localhost:8090 → Topics tab

---

## 5. Send Test Messages

### Option 1: Using Kafka UI (Easiest)

1. Go to http://localhost:8090
2. Click **Topics** → **raw-events**
3. Click **Produce Message**
4. Paste this JSON:
   ```json
   {
     "_schema": "user_event",
     "user_id": "USER123456",
     "event_type": "purchase",
     "timestamp": "2025-12-27T16:00:00Z",
     "product_id": "PROD789"
   }
   ```
5. Click **Produce**

### Option 2: Using Command Line

```bash
# Valid message
docker exec -it dataquarantine-kafka kafka-console-producer \
  --bootstrap-server localhost:9092 \
  --topic raw-events << EOF
{"_schema":"user_event","user_id":"USER123456","event_type":"purchase","timestamp":"2025-12-27T16:00:00Z","product_id":"PROD789"}
EOF

# Invalid message (missing required field)
docker exec -it dataquarantine-kafka kafka-console-producer \
  --bootstrap-server localhost:9092 \
  --topic raw-events << EOF
{"_schema":"user_event","event_type":"purchase"}
EOF
```

---

## 6. Run DataQuarantine Validator

### Option 1: Using Docker (Recommended)

```bash
docker-compose up api
```

### Option 2: Local Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Run the validator
python -m dataquarantine.main
```

**Expected output**:
```
2025-12-27 21:00:00 - dataquarantine - INFO - DataQuarantine v1.0.0 initializing
2025-12-27 21:00:01 - dataquarantine - INFO - Kafka consumer started successfully
2025-12-27 21:00:01 - dataquarantine - INFO - Kafka producer started successfully
2025-12-27 21:00:01 - dataquarantine - INFO - ✅ All components initialized successfully
2025-12-27 21:00:01 - dataquarantine - INFO - 🚀 Starting message processing loop...
```

---

## 7. Verify It's Working

### Check 1: Kafka UI - See Messages Moving

1. Go to http://localhost:8090
2. Click **Topics** → **raw-events**
3. Click **Messages** tab
4. You should see your test message

5. Click **Topics** → **validated-events**
6. Valid messages should appear here

7. Click **Topics** → **quarantine-dlq**
8. Invalid messages should appear here

### Check 2: Prometheus Metrics

1. Go to http://localhost:9090
2. Query: `dataquarantine_records_processed_total`
3. You should see count increasing

### Check 3: PostgreSQL - Quarantined Records

```bash
psql -h localhost -U quarantine_user -d dataquarantine -c \
  "SELECT id, error_type, error_message FROM quarantine_records;"
```

### Check 4: Logs

```bash
# Docker logs
docker-compose logs -f api

# Look for:
# ✅ Valid message routed to validated-events
# ❌ Invalid message quarantined to DLQ
```

---

## 8. Load Testing (Optional)

Generate 1000 test messages:

```bash
# Create test script
cat > send_test_messages.py << 'EOF'
import json
from kafka import KafkaProducer
from datetime import datetime
import random

producer = KafkaProducer(
    bootstrap_servers='localhost:9092',
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

for i in range(1000):
    # 90% valid, 10% invalid
    if random.random() < 0.9:
        message = {
            "_schema": "user_event",
            "user_id": f"USER{i:06d}",
            "event_type": random.choice(["view", "click", "purchase"]),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "product_id": f"PROD{random.randint(1, 100)}"
        }
    else:
        # Invalid: missing required field
        message = {
            "_schema": "user_event",
            "event_type": "purchase"
        }
    
    producer.send('raw-events', message)
    
    if i % 100 == 0:
        print(f"Sent {i} messages...")

producer.flush()
print("✅ Sent 1000 messages!")
EOF

# Run it
pip install kafka-python
python send_test_messages.py
```

**Monitor in Kafka UI**: http://localhost:8090 → Topics → raw-events

---

## 9. Troubleshooting

### Problem: Services won't start

```bash
# Check Docker resources
docker system df

# Clean up old containers
docker-compose down -v
docker system prune -a

# Restart
docker-compose up -d
```

### Problem: Kafka UI shows "Connection refused"

```bash
# Check Kafka is running
docker-compose ps kafka

# Check Kafka logs
docker-compose logs kafka

# Wait 30 seconds for Kafka to fully start
```

### Problem: No messages in validated-events topic

```bash
# Check validator is running
docker-compose ps api

# Check validator logs
docker-compose logs -f api

# Verify schema exists
ls schemas/user_event.yaml
```

### Problem: "Schema not found" error

```bash
# Create default schema
mkdir -p schemas
cat > schemas/user_event.yaml << 'EOF'
name: "user_event"
version: "1.0.0"
type: "json_schema"
schema:
  type: object
  properties:
    user_id:
      type: string
    event_type:
      type: string
      enum: ["view", "click", "purchase"]
    timestamp:
      type: string
      format: date-time
    product_id:
      type: string
  required:
    - user_id
    - event_type
    - timestamp
EOF
```

---

## 10. Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove all data (CAUTION!)
docker-compose down -v
```

---

## 11. Next Steps

1. ✅ **Explore Kafka UI**: Browse topics, messages, consumer groups
2. ✅ **Create Custom Schemas**: Add your own validation rules
3. ✅ **Send Real Data**: Integrate with your applications
4. ✅ **Monitor Metrics**: Set up Grafana dashboards
5. ✅ **Review Quarantined Data**: Check what's failing validation

---

## 12. Port Reference

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **Next.js UI** | 3001 | http://localhost:3001 | 🎨 **Modern Dashboard** - Animated UI |
| **Kafka UI** | 8090 | http://localhost:8090 | 🎯 **Kafka Management** - Topics & Messages |
| **Grafana** | 3000 | http://localhost:3000 | 📊 Metrics dashboards |
| **MinIO Console** | 9001 | http://localhost:9001 | 📦 Object storage |
| **Prometheus** | 9090 | http://localhost:9090 | 🔍 Raw metrics |
| **DataQuarantine API** | 8080 | http://localhost:8080 | 🚀 Validator service |
| **PostgreSQL** | 5432 | localhost:5432 | 🗄️ Database |
| **Kafka Broker** | 9092 | localhost:9092 | 📨 Message broker |
| **Zookeeper** | 2181 | localhost:2181 | 🔧 Coordination |

---

## 13. Demo Script (For Interviews)

**"Let me show you DataQuarantine in action..."**

1. **Open Next.js Dashboard**: http://localhost:3001
   - "This is the modern dashboard I built with Next.js, TypeScript, and Framer Motion"
   - Show animated stat cards with gradients
   - "Real-time metrics with glassmorphism design"

2. **Navigate to Quarantine Browser**:
   - Click "Quarantine" in sidebar
   - "Here I can filter and search quarantined records"
   - Show smooth animations and hover effects

3. **Open Kafka UI**: http://localhost:8090
   - "For Kafka management, I use Kafka UI"
   - Show topics: raw-events, validated-events, quarantine-dlq

4. **Send Valid Message**:
   - Click **Produce Message** on raw-events
   - Show JSON with all required fields
   - "This message has all required fields and correct types"

5. **Show Validation**:
   - Switch to validated-events topic
   - "The message appears here after validation"
   - Go back to Next.js dashboard to see metrics update

6. **Send Invalid Message**:
   - Produce message missing `user_id`
   - "This message is missing a required field"

7. **Show Quarantine**:
   - Switch to quarantine-dlq topic
   - "Invalid message is quarantined with error details"
   - Go to Next.js Quarantine page to see it in the table

8. **Show Metrics**:
   - Back to Next.js Dashboard
   - "Real-time charts showing validation trends"
   - "Error breakdown by type"

**Total demo time**: 3-5 minutes

---

## 14. Support

- **Documentation**: See `docs/` folder
- **Issues**: Check logs with `docker-compose logs -f`
- **Questions**: Review `docs/INTERVIEW_PREP.md`

---

**🎉 You're ready to go!**

**Start with the Next.js Dashboard**: http://localhost:3001  
**Or use Kafka UI**: http://localhost:8090
