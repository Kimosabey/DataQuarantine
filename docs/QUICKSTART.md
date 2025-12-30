# 🚀 DataQuarantine - Complete Quickstart Guide

This guide will get you from zero to a fully running DataQuarantine system in **under 10 minutes**. Whether you're a beginner or experienced developer, follow these steps to get started.

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Docker Desktop** installed and running
  - Windows: [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
  - Verify: `docker --version` and `docker-compose --version`
- **Git** (to clone the repository)
- **DBeaver** (optional, for database management) - [Download](https://dbeaver.io/download/)
- **8GB RAM minimum** (16GB recommended)
- **10GB free disk space**

---

## ⚡ Quick Start (3 Steps)

### Step 1: Clone & Navigate
```bash
git clone https://github.com/yourusername/dataquarantine.git
cd dataquarantine
```

### Step 2: Start All Services
```bash
docker-compose up -d
```

This single command starts **8 services**:
1. PostgreSQL (Database)
2. Zookeeper (Kafka dependency)
3. Kafka (Message Queue)
4. MinIO (Object Storage)
5. Prometheus (Metrics)
6. Grafana (Dashboards)
7. Kafka UI (Kafka Management)
8. API Backend (FastAPI)

**Wait Time**: ~30-60 seconds for all services to initialize

### Step 3: Verify Everything is Running
```bash
docker ps
```

You should see 8 containers with status "Up":

| Container Name | Status |
|----------------|--------|
| dataquarantine-api | Up |
| dataquarantine-frontend | Up |
| dataquarantine-postgres | Up |
| dataquarantine-kafka | Up |
| dataquarantine-zookeeper | Up |
| dataquarantine-minio | Up |
| dataquarantine-prometheus | Up |
| dataquarantine-grafana | Up |

---

## 🌐 Access Your Services

Once all containers are running, access these URLs in your browser:

| Service | URL | Default Credentials | Purpose |
|---------|-----|---------------------|---------|
| **🎨 Frontend** | http://localhost:3000 | None | Main User Interface |
| **📡 API Docs** | http://localhost:8800/docs | None | Interactive API Documentation |
| **📊 Kafka UI** | http://localhost:8090 | None | Kafka Cluster Visualization |
| **📈 Grafana** | http://localhost:3001 | admin / admin | Metrics & Dashboards |
| **📦 MinIO** | http://localhost:9001 | minioadmin / minioadmin | Object Storage Console |
| **🔍 Prometheus** | http://localhost:9090 | None | Metrics Collection |

### Database Connection (DBeaver)

**Connection Details:**
- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `dataquarantine`
- **Username**: `quarantine_user`
- **Password**: `quarantine_pass`

---

## 🔍 Step-by-Step Verification Guide

Follow this checklist to verify each component is working correctly.

### 1️⃣ Frontend (Port 3000)

**What is it?** Your main user interface where users interact with the DataQuarantine system.

**How to Check:**
1. Open http://localhost:3000 in your browser
2. You should see the Dashboard with animated UI
3. Press `F12` → Console tab → Should have minimal/no red errors
4. Try clicking navigation links to ensure pages load

**Common Issues:**
- **Page doesn't load**: Check if frontend container is running (`docker ps`)
- **Blank page**: Check browser console for errors
- **Data not showing**: Backend API might not be connected

---

### 2️⃣ API Backend (Port 8800)

**What is it?** The brain of your system - handles all business logic, data processing, and communication.

**How to Check:**
1. Visit http://localhost:8800/docs
2. You should see **Swagger UI** with all API endpoints
3. Try the `/health` endpoint:
   - Click "GET /health"
   - Click "Try it out"
   - Click "Execute"
   - Should return: `{"status": "healthy"}`

**How to Check Logs:**
```bash
docker logs dataquarantine-api
```

**What to Look For:**
- ✅ "Application startup complete"
- ✅ "Connected to database"
- ✅ "Connected to Kafka"
- ❌ NO red "ERROR" messages

**Common Issues:**
- **API doesn't respond**: Check if API container is running
- **Connection errors**: Ensure PostgreSQL and Kafka are running
- **500 errors**: Check API logs for Python errors

---

### 3️⃣ Kafka UI (Port 8090)

**What is it?** Kafka is like a super-fast postal service for your application. It delivers messages between different parts of your system.

**Beginner Explanation:**
- **Producer**: The sender (your API sends messages here)
- **Topic**: A mailbox (e.g., "quarantine-events" topic)
- **Consumer**: The reader (background workers read from here)
- **Lag**: How far behind the consumer is

**How to Check:**
1. Visit http://localhost:8090
2. Click **"Clusters"** tab
   - Should show "dataquarantine-cluster"
   - Status: **Online** or **Healthy**

3. Click **"Topics"** tab
   - Should see topics like:
     - `raw-events`
     - `validated-events`
     - `quarantine-dlq`
   
4. Click on a topic to inspect:
   - **Messages**: The actual data
   - **Partitions**: Usually 1 for local dev
   - **Consumer Groups**: Who's reading messages

**What to Look For:**
- ✅ Topics exist
- ✅ Message count increases when data flows
- ✅ Consumer lag is 0 or low (< 100)

**Common Issues:**
- **No topics visible**: Wait 30 seconds more, or check Kafka logs
- **Consumer lag high**: Consumer might be slow or crashed
- **Connection errors**: Kafka still initializing (wait up to 60 seconds)

---

### 4️⃣ PostgreSQL Database (DBeaver)

**What is it?** A relational database that stores structured metadata about quarantine records, validation rules, and audit logs.

**How to Connect via DBeaver:**

1. Open **DBeaver**
2. Click **"New Database Connection"** (plug icon)
3. Select **PostgreSQL**
4. Enter connection details:
   - Host: `localhost`
   - Port: `5432`
   - Database: `dataquarantine`
   - Username: `quarantine_user`
   - Password: `quarantine_pass`
5. Click **"Test Connection"** → Should say "Connected"
6. Click **"Finish"**

**What to Check:**

1. **Tables Exist**:
   - Expand: dataquarantine → Schemas → public → Tables
   - Should see:
     - `quarantine_records`
     - `validation_rules`
     - `schemas`
     - etc.

2. **View Data**:
   - Right-click `quarantine_records` → **"View Data"**
   - Should see rows (if system has processed data)

3. **Run a Query**:
   - Click **SQL Editor** button
   - Try:
     ```sql
     SELECT COUNT(*) FROM quarantine_records;
     SELECT * FROM quarantine_records LIMIT 10;
     ```

**Useful Beginner Queries:**

```sql
-- See all tables in database
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Count total quarantined records
SELECT COUNT(*) FROM quarantine_records;

-- See recent records
SELECT * FROM quarantine_records 
ORDER BY created_at DESC 
LIMIT 20;

-- Check validation rules
SELECT * FROM validation_rules;
```

**Common Issues:**
- **Can't connect**: Check PostgreSQL container is running
- **Tables don't exist**: Database initialization might have failed (check logs)
- **Empty tables**: System hasn't processed any data yet

---

### 5️⃣ MinIO Console (Port 9001)

**What is it?** Object storage (like AWS S3) where actual files (CSVs, JSONs, etc.) are stored.

**Beginner Analogy:** MinIO is like Google Drive for your application. Each "bucket" is a top-level folder.

**How to Check:**

1. Visit http://localhost:9001
2. Login:
   - Username: `minioadmin`
   - Password: `minioadmin`

3. Check **Buckets**:
   - Should see buckets like:
     - `quarantine`
     - `validated-data`
     - `rejected-data`
   
4. Browse Files:
   - Click on a bucket
   - You'll see folders/files organized by date (e.g., `2025/12/30/`)
   - Click on a file to preview or download

**Bucket Structure Example:**
```
quarantine/
├── 2025/
│   └── 12/
│       └── 30/
│           ├── suspicious_file_001.csv
│           └── invalid_data_002.json

validated-data/
└── 2025/
    └── 12/
        └── 30/
            └── clean_file_003.csv
```

**What to Look For:**
- ✅ Buckets exist
- ✅ Files are being stored (if data is flowing)
- ✅ Can download and view files

**Common Issues:**
- **Buckets not created**: They're auto-created on first use, or create manually
- **Can't login**: Double-check credentials (`minioadmin`/`minioadmin`)

---

### 6️⃣ Prometheus (Port 9090)

**What is it?** The metrics collector. It constantly asks all services "How are you doing?" and stores the answers.

**How to Check:**

1. Visit http://localhost:9090
2. Click **Status → Targets**
3. You should see all monitored services:
   - `api` - Your FastAPI backend
   - `kafka` - Kafka metrics exporter
   - `postgres` - Database metrics
   - All should show **State: UP** (green)

4. Try a Query:
   - Click **Graph** tab
   - In the query box, enter: `up`
   - Click **Execute**
   - Should show which services are running (1 = up, 0 = down)

**Example Queries to Try:**

```promql
# See all services status
up

# HTTP requests to API
http_requests_total

# API response time
http_request_duration_seconds

# Database connections
pg_stat_database_numbackends
```

**What to Look For:**
- ✅ All targets are UP (green)
- ✅ Queries return data
- ✅ Metrics update over time

**Common Issues:**
- **Targets DOWN**: The service might not be exposing metrics or is crashed
- **No data**: Wait a few minutes for first scrape cycle

---

### 7️⃣ Grafana (Port 3001)

**What is it?** Beautiful dashboard tool to visualize all the metrics Prometheus collects.

**How to Check:**

1. Visit http://localhost:3001
2. Login:
   - Username: `admin`
   - Password: `admin`
   - (You'll be prompted to change on first login)

3. Verify Data Source:
   - Click **⚙️ Configuration** → **Data Sources**
   - Should see **Prometheus** listed
   - Click on it → Click **"Test"** → Should say "Data source is working"

4. View Dashboards:
   - Click **📊 Dashboards** → **Browse**
   - Look for DataQuarantine dashboards
   - Click to open and view metrics

**Key Metrics to Monitor:**

| Metric | What to Look For |
|--------|------------------|
| **API Request Rate** | 10-100 requests/min |
| **Validation Success Rate** | Should be > 95% |
| **Quarantine Rate** | Should be < 5% |
| **Database Connections** | Should be stable (not maxing out) |
| **Kafka Consumer Lag** | Should be near 0 |

**Common Issues:**
- **"No data" in panels**: Check time range (top-right), try "Last 6 hours"
- **Data source connection error**: Verify Prometheus is running
- **Dashboard not loading**: Wait a minute, Grafana might still be initializing

---

## 🎯 Complete System Health Checklist

Use this checklist to verify your entire system is healthy:

### Infrastructure Layer
- [ ] **8 Docker containers running**: `docker ps`
- [ ] **No container restarts**: Check "Status" column shows "Up X minutes/hours"
- [ ] **All containers healthy**: No "(unhealthy)" status

### Database Layer
- [ ] **PostgreSQL running**: `docker logs dataquarantine-postgres` shows no errors
- [ ] **Tables exist**: Verify in DBeaver
- [ ] **Can query data**: Run test SQL queries

### Message Queue Layer
- [ ] **Kafka broker online**: Kafka UI → Brokers shows "Online"
- [ ] **Topics exist**: Kafka UI → Topics shows 3+ topics
- [ ] **Messages flowing**: Message count increases over time

### Storage Layer
- [ ] **MinIO accessible**: Can login to http://localhost:9001
- [ ] **Buckets created**: At least 1 bucket visible
- [ ] **Files stored**: Can browse and download files

### API Layer
- [ ] **API responds**: http://localhost:8800/docs loads
- [ ] **Health check passes**: `/health` endpoint returns "healthy"
- [ ] **No errors in logs**: `docker logs dataquarantine-api` shows no red errors

### Frontend Layer
- [ ] **UI loads**: http://localhost:3000 displays dashboard
- [ ] **No console errors**: Browser console (F12) shows no red errors
- [ ] **Can navigate**: Click through different pages

### Monitoring Layer
- [ ] **Prometheus collecting**: http://localhost:9090/targets shows all UP
- [ ] **Grafana connected**: Data source test passes
- [ ] **Dashboards loading**: Can view metrics in Grafana

---

## 🐛 Common Issues & Solutions

### Issue: Container Keeps Restarting

**Symptoms:** `docker ps` shows status like "Restarting (1) X seconds ago"

**Solution:**
```bash
# Check logs to see why it's crashing
docker logs dataquarantine-<service-name>

# Common fixes:
# 1. Not enough memory - Close other apps, increase Docker memory limit
# 2. Port conflict - Check if port is already in use
# 3. Configuration error - Check docker-compose.yml
```

---

### Issue: Can't Connect to Database

**Symptoms:** API logs show "Connection to database failed"

**Solution:**
```bash
# 1. Check PostgreSQL is running
docker ps | grep postgres

# 2. Check PostgreSQL logs
docker logs dataquarantine-postgres

# 3. Verify credentials match
# Compare docker-compose.yml with your connection settings

# 4. Wait longer (PostgreSQL takes ~10 seconds to start)
sleep 15 && docker logs dataquarantine-api
```

---

### Issue: Kafka Connection Failed

**Symptoms:** API logs show "KafkaConnectionError" or "Unable to bootstrap"

**Solution:**
```bash
# Kafka takes 30-60 seconds to fully initialize
# 1. Check Kafka is running
docker ps | grep kafka

# 2. Check Kafka logs for "started" message
docker logs dataquarantine-kafka | grep "started"

# 3. Ensure Zookeeper is also running
docker ps | grep zookeeper

# 4. Wait and retry
# Kafka can take up to 60 seconds on first start
```

---

### Issue: Frontend Shows Blank Page

**Symptoms:** Browser shows white/blank page

**Solution:**
```bash
# 1. Check browser console (F12)
# Look for specific error messages

# 2. Check frontend container logs
docker logs dataquarantine-frontend

# 3. Verify API is accessible
curl http://localhost:8800/health

# 4. Clear browser cache and refresh
# Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

---

### Issue: MinIO Buckets Not Created

**Symptoms:** Login successful but no buckets visible

**Solution:**
1. Buckets are auto-created on first API call
2. Generate some test data through the API
3. Or manually create bucket:
   - MinIO Console → Buckets → **Create Bucket**
   - Bucket Name: `quarantine`
   - Click **Create**

---

### Issue: Grafana Shows "No Data"

**Symptoms:** Dashboards load but all panels show "No data"

**Solution:**
1. **Check time range** (top-right corner):
   - Change to "Last 6 hours" or "Last 24 hours"
2. **Verify Prometheus is collecting**:
   - Visit http://localhost:9090/targets
   - All should be UP (green)
3. **Generate some activity**:
   - Make API calls to generate metrics
   - Wait 1-2 minutes for metrics to appear
4. **Check data source**:
   - Grafana → Configuration → Data Sources
   - Click Prometheus → Test → Should succeed

---

## 📊 What Data Should You See?

### In Kafka UI (http://localhost:8090)

**Topics You'll See:**
- `raw-events` - Incoming data from producers
- `validated-events` - Clean, validated data
- `quarantine-dlq` - Invalid data sent to quarantine

**Example Message in quarantine-dlq:**
```json
{
  "original_message": {
    "_schema": "user_event",
    "event_type": "purchase"
  },
  "validation_error": {
    "error_type": "schema_violation",
    "error_message": "'user_id' is a required property",
    "field_path": "user_id"
  },
  "source_topic": "raw-events",
  "source_offset": 12345,
  "quarantined_at": "2025-12-30T09:00:00Z"
}
```

---

### In MinIO Console (http://localhost:9001)

**Bucket Structure:**
```
quarantine/
├── raw-events/
│   └── 0/
│       └── 12345_uuid-here.json
validated/
└── processed/
    └── 2025-12-30.csv
```

**File Contents (Example):**
- JSON files with full quarantined record
- Original message + error context
- Timestamp and metadata

---

### In PostgreSQL (DBeaver)

**Sample Row from `quarantine_records`:**

| id | topic | partition | offset | schema_name | error_type | status | created_at |
|----|-------|-----------|--------|-------------|------------|--------|------------|
| uuid-1 | raw-events | 0 | 12345 | user_event | schema_violation | quarantined | 2025-12-30 09:00:00 |

**Query to Check:**
```sql
SELECT 
    error_type,
    COUNT(*) as count,
    MAX(created_at) as most_recent
FROM quarantine_records
GROUP BY error_type
ORDER BY count DESC;
```

---

### In Grafana Dashboards

**Typical Metrics You'll See:**

| Panel | Typical Value | What It Means |
|-------|---------------|---------------|
| API Request Rate | 10-50 req/min | Number of API calls |
| Validation Success Rate | 95-99% | Percentage of valid messages |
| Quarantine Rate | 1-5% | Percentage quarantined |
| Database Connections | 5-10 | Active DB connections |
| Kafka Consumer Lag | 0-10 | Messages waiting to be processed |
| p99 Latency | < 50ms | 99th percentile response time |

---

## 🎓 Next Steps

### 1. **Explore Each Component** (10 minutes each)
- Spend time clicking around each UI
- Try different queries in DBeaver
- Browse different topics in Kafka UI
- Create test dashboards in Grafana

### 2. **Generate Test Data** (Practice)
```bash
# Use the API to send test messages
curl -X POST http://localhost:8800/api/v1/validate \
  -H "Content-Type: application/json" \
  -d '{
    "_schema": "user_event",
    "user_id": "USER123456",
    "event_type": "purchase",
    "timestamp": "2025-12-30T09:00:00Z"
  }'
```

Watch the data flow:
1. **Kafka UI** → Check `raw-events` topic
2. **API logs** → `docker logs -f dataquarantine-api`
3. **DBeaver** → Query `quarantine_records` table
4. **MinIO** → Check if file appears in bucket

### 3. **Break Something (Learning)**
- Intentionally stop a container: `docker stop dataquarantine-kafka`
- Observe what happens in logs
- Practice diagnosing the issue
- Restart and verify recovery: `docker start dataquarantine-kafka`

### 4. **Read the Documentation**
- [ARCHITECTURE_GUIDE.md](./ARCHITECTURE_GUIDE.md) - System design
- [FLOW.md](./FLOW.md) - Detailed data flow walkthrough
- [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) - Comprehensive testing

---

## 📚 Additional Resources

### Official Documentation
- **Kafka**: https://kafka.apache.org/documentation/
- **FastAPI**: https://fastapi.tiangolo.com/
- **PostgreSQL**: https://www.postgresql.org/docs/
- **MinIO**: https://min.io/docs/
- **Prometheus**: https://prometheus.io/docs/
- **Grafana**: https://grafana.com/docs/

### Video Tutorials (YouTube)
- "Apache Kafka in 5 Minutes"
- "Grafana Tutorial for Beginners"
- "DBeaver Database Tutorial"
- "Docker Compose Tutorial"

---

## 💡 Pro Tips

1. **Keep Logs Open**: Run this in a separate terminal:
   ```bash
   docker-compose logs -f api
   ```
   Watch live logs while you interact with the system

2. **Use Bookmarks**: Create a browser bookmark folder with all 6 service URLs

3. **Screenshot Errors**: Capture error messages for troubleshooting

4. **Daily Practice**: Spend 10 minutes daily exploring one component deeply

5. **Document Your Findings**: Keep notes of what works and what doesn't

---

## ✅ You're Ready!

Congratulations! You now have:
- ✅ All services running
- ✅ Access to every component
- ✅ Understanding of what each service does
- ✅ Troubleshooting skills

Remember:
- **Don't rush** - These are enterprise-level tools
- **Experiment safely** - It's a local POC, you can always restart
- **Focus on understanding** - Follow the data flow
- **Ask for help** - Share specific errors when stuck

---

**Last Updated**: December 2025  
**Document Version**: 2.0  
**Status**: ✅ Production Ready

**Happy Learning! 🚀**
