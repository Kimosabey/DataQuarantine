# 🎓 Complete Beginner's Guide to DataQuarantine System

Welcome! This guide will walk you through **every component** of your DataQuarantine system. Since you're new to most of these tools, I'll explain what each one does, what to check, and how to verify everything is working.

---

## 📋 Quick Reference - All Services

| Service | URL | Default Login | Purpose |
|---------|-----|---------------|---------|
| **Frontend** | http://localhost:3000 | N/A | Main User Interface |
| **API** | http://localhost:8080 | N/A | Backend REST API |
| **Kafka UI** | http://localhost:8090 | No login | Kafka Cluster Visualization |
| **Grafana** | http://localhost:3001 | admin/admin | Metrics & Dashboards |
| **MinIO Console** | http://localhost:9001 | minioadmin/minioadmin | Object Storage Admin |
| **Prometheus** | http://localhost:9090 | No login | Metrics Server |
| **DBeaver** | Local IDE | (Your config) | Database Management |

---

## 🚀 Step-by-Step Verification Guide

### 1️⃣ **Frontend (http://localhost:3000)** 
**What is it?**: Your main user interface where end-users interact with the DataQuarantine system.

**What to Check:**
- [ ] **Page Loads**: Open http://localhost:3000 in your browser
- [ ] **UI Responds**: Check if buttons, forms, and menus work
- [ ] **Data Displays**: Verify that data from the backend shows up correctly
- [ ] **No Console Errors**: Press `F12` → Go to "Console" tab → Should see minimal/no red errors

**Common Issues:**
- If page doesn't load: Check if the frontend service is running (`npm start` or similar)
- If data doesn't appear: Backend API might not be running or database is empty

---

### 2️⃣ **API - Backend (http://localhost:8080)**
**What is it?**: The brain of your system. Handles all business logic, data processing, and communication between services.

**What to Check:**
- [ ] **Health Check**: Visit http://localhost:8080/docs or http://localhost:8080/health
  - Should see API documentation (Swagger UI) or a health status response
- [ ] **API Documentation**: If Swagger/FastAPI docs are available, you'll see all available endpoints
- [ ] **Test an Endpoint**: 
  - Try a simple GET request like http://localhost:8080/api/v1/quarantine/records
  - You can use your browser or tools like Postman

**Common Issues:**
- If API doesn't respond: Check Docker logs with `docker logs dataquarantine-api`
- Connection errors: Ensure Postgres and Kafka are running

**How to Check Logs:**
```bash
docker logs dataquarantine-api
```

---

### 3️⃣ **Kafka UI (http://localhost:8090)**
**What is it?**: Kafka is a message queue system. Think of it as a super-fast postal service that delivers messages between different parts of your application.

**What to Check:**
- [ ] **Clusters Tab**: 
  - Should see "dataquarantine-cluster" listed
  - Status should be "Online" or "Healthy"
  
- [ ] **Topics Tab**: 
  - Look for topics like: `quarantine-events`, `data-validation`, etc.
  - Click on a topic to see:
    - **Messages**: The actual data flowing through
    - **Partitions**: How data is divided (usually 1 for local dev)
    - **Consumer Groups**: Who is reading these messages
  
- [ ] **Brokers Tab**:
  - Should show 1 broker (kafka:29092)
  - Status: Running

**What to Look For:**
- **Message Count**: Should increase as your system processes data
- **Consumer Lag**: Should be 0 or very low (means messages are being processed quickly)

**Beginner Tip**: 
Messages in Kafka are like emails in an inbox. The "Producer" sends messages, the "Consumer" reads them. If consumer lag is high, it means the consumer is slow to process messages.

---

### 4️⃣ **Grafana (http://localhost:3001)**
**What is it?**: A beautiful dashboard tool to visualize metrics. Think of it as your system's "health monitor" with graphs and charts.

**Login:** 
- Username: `admin`
- Password: `admin`
- (You'll be prompted to change this on first login)

**What to Check:**
- [ ] **Data Sources** (Left menu → Configuration → Data Sources):
  - Should have "Prometheus" configured
  - Click "Test" button → Should say "Data source is working"
  
- [ ] **Dashboards** (Left menu → Dashboards):
  - Look for pre-configured dashboards about your DataQuarantine system
  - Example metrics to watch:
    - **API Request Rate**: How many requests per second
    - **Error Rate**: Should be very low
    - **Kafka Messages**: Messages processed over time
    - **Database Connections**: Active connections to Postgres
  
- [ ] **Explore** (Left menu → Explore):
  - Try querying some basic metrics like: `up{job="api"}`
  - Should show if your API is up (1 = up, 0 = down)

**Beginner Tip**:
- Click on any graph to zoom in
- Change time range in top-right (e.g., "Last 1 hour", "Last 24 hours")
- Grafana fetches all data from Prometheus automatically

---

### 5️⃣ **MinIO Console (http://localhost:9001)**
**What is it?**: MinIO is object storage (like AWS S3). Your quarantined/suspicious data files are stored here.

**Login:**
- Username: `minioadmin`
- Password: `minioadmin`

**What to Check:**
- [ ] **Buckets**:
  - Look for buckets like: `quarantine`, `validated-data`, `rejected-data`
  - Click on a bucket to see stored files
  
- [ ] **Browse Files**:
  - Click on any bucket
  - You should see folders or files (depending on your system's activity)
  - Click on a file to preview or download
  
- [ ] **Metrics** (Top menu):
  - Shows storage usage, API calls, bandwidth
  
- [ ] **Access Keys** (Left menu → Identity → Service Accounts):
  - These are the credentials your API uses to access MinIO
  - Verify the keys match your `.env` or `docker-compose.yml`

**Beginner Tip**:
Think of MinIO like Google Drive, but for your application. Each "bucket" is like a folder, and you store files (CSVs, JSONs, images) in them.

---

### 6️⃣ **Prometheus (http://localhost:9090)**
**What is it?**: The metrics collector. It constantly asks all services "How are you doing?" and stores the answers as time-series data.

**What to Check:**
- [ ] **Targets** (Top menu → Status → Targets):
  - Should show all monitored services
  - State should be "UP" (green)
  - Common targets:
    - `api` - Your FastAPI backend
    - `kafka` - Kafka metrics
    - `postgres` - Database metrics
  
- [ ] **Graph** (Top menu → Graph):
  - Try querying: `up`
    - Shows which services are up (1) or down (0)
  - Try querying: `http_requests_total`
    - Shows total HTTP requests to your API
  
- [ ] **Alerts** (Top menu → Alerts):
  - May be empty if no alerts configured
  - If configured, check if any are firing (red)

**Beginner Tip**:
Prometheus uses a query language called PromQL. Don't worry about mastering it now. Just use the examples above to see if data is being collected.

**Example Queries to Try:**
```promql
# See all HTTP requests
http_requests_total

# See API response time
http_request_duration_seconds

# See database connections
pg_stat_database_numbackends
```

---

### 7️⃣ **DBeaver (Database IDE)**
**What is it?**: A powerful tool to connect to databases, run SQL queries, and inspect your data directly.

**How to Connect to PostgreSQL:**

1. **Open DBeaver** → Click "New Database Connection"

2. **Select PostgreSQL** → Click "Next"

3. **Enter Connection Details:**
   - **Host**: `localhost`
   - **Port**: `5432`
   - **Database**: `dataquarantine`
   - **Username**: `quarantine_user`
   - **Password**: `quarantine_pass`

4. **Test Connection** → Should say "Connected"

5. **Click Finish**

**What to Check in DBeaver:**

- [ ] **Tables** (Left Panel → dataquarantine → Schemas → public → Tables):
  - Should see tables like:
    - `quarantine_records`
    - `validation_rules`
    - `audit_logs`
    - etc.
  
- [ ] **Data Preview**:
  - Right-click any table → "View Data"
  - Should see rows of data (if system has processed any)
  
- [ ] **Run a Query**:
  - Click "SQL Editor" button (top toolbar)
  - Try: 
    ```sql
    SELECT * FROM quarantine_records LIMIT 10;
    ```
  - Should return up to 10 rows

- [ ] **Table Structure**:
  - Right-click table → "View Table" → "Columns"
  - See all column names, types, constraints

**Useful Queries for Beginners:**

```sql
-- See all tables in the database
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Count total records in quarantine
SELECT COUNT(*) FROM quarantine_records;

-- See recent quarantine records
SELECT * FROM quarantine_records 
ORDER BY created_at DESC 
LIMIT 20;

-- Check validation rules
SELECT * FROM validation_rules;
```

**Beginner Tip**:
- Use `Ctrl+Enter` to run a query
- DBeaver shows results in a grid below your query
- You can export results to CSV, Excel, etc. (right-click on results)

---

## 🔍 Complete System Health Checklist

Use this checklist to verify your entire system is healthy:

### Infrastructure Layer:
- [ ] Docker containers running: `docker ps` (should show 8 containers)
- [ ] No container restarts: Check "Status" column (should not say "Restarting")

### Database Layer:
- [ ] PostgreSQL running: Check in DBeaver or `docker logs dataquarantine-postgres`
- [ ] Tables exist: Query in DBeaver
- [ ] Sample data present: Check row count

### Message Queue Layer:
- [ ] Kafka broker online: Check in Kafka UI → Brokers
- [ ] Topics exist: Check in Kafka UI → Topics
- [ ] Messages flowing: Check message count increases over time

### Storage Layer:
- [ ] MinIO buckets created: Check in MinIO Console → Buckets
- [ ] Files stored (if applicable): Browse bucket contents

### API Layer:
- [ ] API responds: Visit http://localhost:8080/docs
- [ ] No errors in logs: `docker logs dataquarantine-api`
- [ ] Endpoints return data: Test a GET endpoint

### Frontend Layer:
- [ ] UI loads: Visit http://localhost:3000
- [ ] No errors in browser console: Press F12 → Console tab
- [ ] Can interact with UI: Click buttons, submit forms

### Monitoring Layer:
- [ ] Prometheus collecting data: Check http://localhost:9090/targets (all should be UP)
- [ ] Grafana connected: Check http://localhost:3001 → Data Sources

---

## 🐛 Troubleshooting Common Issues

### Issue: "Can't connect to database"
**Solution:**
1. Check if Postgres is running: `docker ps | grep postgres`
2. Check logs: `docker logs dataquarantine-postgres`
3. Verify credentials in `.env` or `docker-compose.yml`
4. Try connecting manually with DBeaver

### Issue: "Kafka connection failed"
**Solution:**
1. Check if Kafka is running: `docker ps | grep kafka`
2. Check if Zookeeper is running: `docker ps | grep zookeeper`
3. Check logs: `docker logs dataquarantine-kafka`
4. Wait 30-60 seconds after starting (Kafka takes time to initialize)

### Issue: "API returns 500 errors"
**Solution:**
1. Check API logs: `docker logs dataquarantine-api -f`
2. Look for Python errors or stack traces
3. Check if database migrations ran: Look for "migration" messages in logs
4. Verify all environment variables are set correctly

### Issue: "MinIO buckets not created"
**Solution:**
1. Check MinIO logs: `docker logs dataquarantine-minio`
2. Buckets might be auto-created on first use by the API
3. Create manually: MinIO Console → Buckets → Create Bucket

### Issue: "Grafana shows 'No data'"
**Solution:**
1. Verify Prometheus is collecting data: http://localhost:9090/targets
2. Check if data source is configured: Grafana → Configuration → Data Sources
3. Change time range to "Last 1 hour" (top-right in Grafana)
4. Generate some activity in your system (API calls, etc.)

---

## 📊 What Data Should You See?

### In Kafka UI:
- **Topics**: `quarantine-events`, `validation-results`, etc.
- **Messages**: JSON objects with data validation info
- **Example Message**:
  ```json
  {
    "record_id": "123",
    "status": "quarantined",
    "reason": "Invalid email format",
    "timestamp": "2025-12-29T12:00:00Z"
  }
  ```

### In MinIO:
- **Buckets**: `quarantine/`, `validated/`, `rejected/`
- **Files**: CSV files, JSON files, or whatever your system processes
- **Example Path**: `quarantine/2025/12/29/suspicious_data_001.csv`

### In PostgreSQL (DBeaver):
- **Tables**: Metadata about quarantined records
- **Columns**: `id`, `filename`, `status`, `reason`, `created_at`, etc.
- **Sample Row**:
  | id | filename | status | reason | created_at |
  |----|----------|--------|--------|------------|
  | 1 | file.csv | quarantined | Invalid schema | 2025-12-29 12:00:00 |

### In Grafana:
- **Graphs**: Line charts showing metrics over time
- **Example Metrics**:
  - API requests per minute: 10-50 req/min
  - Database connections: 5-10 connections
  - Kafka messages: Increasing over time
  - Error rate: Ideally 0% or < 1%

---

## 🎯 Next Steps

1. **Start Small**: Focus on one component at a time
   - Start with the API and database
   - Then move to Kafka
   - Finally, explore monitoring (Prometheus/Grafana)

2. **Generate Test Data**: 
   - Use the API to create some test records
   - Watch them flow through Kafka UI
   - See them appear in the database (DBeaver)
   - Check if files are stored in MinIO

3. **Build Familiarity**:
   - Spend 10 minutes with each tool daily
   - Try different queries in DBeaver
   - Explore different metrics in Grafana
   - Browse messages in Kafka UI

4. **Learn by Doing**:
   - Break something intentionally (stop a container)
   - Try to diagnose the issue using logs
   - Fix it and verify everything works again

---

## 📚 Additional Resources

### Official Documentation:
- **Kafka UI**: https://docs.kafka-ui.provectus.io/
- **Grafana**: https://grafana.com/docs/
- **MinIO**: https://min.io/docs/
- **Prometheus**: https://prometheus.io/docs/
- **DBeaver**: https://dbeaver.com/docs/

### Video Tutorials (Search on YouTube):
- "Kafka for Beginners"
- "Grafana Tutorial"
- "DBeaver Tutorial"
- "MinIO S3 Tutorial"

---

## 💡 Pro Tips

1. **Keep Logs Open**: Run `docker-compose logs -f api` in a terminal to watch live logs
2. **Use Bookmarks**: Bookmark all 6 URLs in a browser folder
3. **Screenshot Errors**: Take screenshots of errors to troubleshoot later
4. **Ask for Help**: Share specific error messages or logs when seeking help
5. **Document Your Changes**: Keep notes of what works and what doesn't

---

## ✅ You're Ready!

You now have a complete guide to your DataQuarantine system. Remember:
- **Don't rush** - Take time to understand each component
- **It's okay to not know everything** - These are enterprise-level tools
- **Experiment safely** - It's just a local POC, you can always restart containers
- **Focus on the flow** - Understand how data moves from Frontend → API → Kafka → Storage → Database

Happy exploring! 🚀
