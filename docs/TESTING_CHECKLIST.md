# ✅ Complete Testing Checklist - DataQuarantine System

Use this checklist to verify every component of your system is working correctly.

---

## 🎯 Before You Start

- [ ] All Docker containers are running: `docker ps` (should show 8 containers)
- [ ] No containers are restarting (check "Status" column)
- [ ] Frontend is running on http://localhost:3000 ✅
- [ ] API is running on http://localhost:8080 ✅

---

## 1️⃣ Frontend (http://localhost:3000)

### Visual Checks:
- [ ] Page loads without errors
- [ ] All UI elements are visible (buttons, forms, navigation)
- [ ] No broken images or icons
- [ ] Styling looks correct (colors, spacing, fonts)

### Functional Checks:
- [ ] Can navigate between pages
- [ ] Forms accept input
- [ ] Buttons respond to clicks
- [ ] Data displays from backend (if applicable)

### Developer Console (Press F12):
- [ ] **Console tab**: No critical errors (some warnings are okay)
- [ ] **Network tab**: API calls return 200/201 status codes
- [ ] **Network tab**: No failed requests (red entries)

**What to Look For:**
- ✅ Green checkmarks in Network tab
- ✅ Fast loading times (< 3 seconds)
- ❌ Red errors in Console
- ❌ 404, 500 status codes in Network

---

## 2️⃣ API Backend (http://localhost:8080)

### API Documentation:
- [ ] Visit http://localhost:8080/docs
- [ ] Swagger UI loads with all endpoints listed
- [ ] Can expand endpoint sections (GET, POST, etc.)

### Test Endpoints:
1. **Health Check** (if available):
   - [ ] Visit http://localhost:8080/health or /api/health
   - [ ] Should return: `{"status": "healthy"}` or similar

2. **GET Endpoint** (e.g., list quarantine records):
   - [ ] Click "Try it out" in Swagger UI
   - [ ] Click "Execute"
   - [ ] Response Code: 200
   - [ ] Response Body: JSON array/object (may be empty if no data)

3. **POST Endpoint** (if testing data submission):
   - [ ] Fill in required fields
   - [ ] Click "Execute"
   - [ ] Response Code: 201 (Created) or 200 (OK)
   - [ ] Response Body: Confirmation message

### API Logs:
```bash
docker logs dataquarantine-api --tail 50
```

**What to Look For:**
- ✅ "Application startup complete" or similar message
- ✅ "Connected to database" message
- ✅ "Connected to Kafka" message
- ❌ Python exceptions/stack traces
- ❌ "Connection refused" errors

---

## 3️⃣ Kafka UI (http://localhost:8090)

### Cluster Health:
- [ ] Go to **Dashboard** or **Clusters**
- [ ] Cluster name: "dataquarantine-cluster"
- [ ] Status: Online/Healthy (green indicator)

### Brokers:
- [ ] Go to **Brokers** tab
- [ ] Should see: 1 broker (kafka:29092)
- [ ] Status: Running

### Topics:
- [ ] Go to **Topics** tab
- [ ] Should see topics like:
  - [ ] `quarantine-events`
  - [ ] `data-validation`
  - [ ] `audit-logs` (names may vary)

**For Each Topic:**
- [ ] Click on topic name
- [ ] Check **Partitions**: Usually 1 for local dev
- [ ] Check **Messages**: May be 0 if no data processed yet
- [ ] Go to **Messages** tab → Click "Fetch Messages"
- [ ] Should see JSON messages (or empty if system just started)

### Consumer Groups:
- [ ] Go to **Consumers** tab
- [ ] Should see consumer groups (if API is consuming messages)
- [ ] **Lag**: Should be 0 or very low (< 10)

**What to Look For:**
- ✅ All topics created
- ✅ Messages incrementing over time (if system is active)
- ✅ Consumer lag = 0 or low
- ❌ No topics found
- ❌ High consumer lag (> 1000)

---

## 4️⃣ MinIO Console (http://localhost:9001)

### Login:
- [ ] Username: `minioadmin`
- [ ] Password: `minioadmin`
- [ ] Successfully logged in

### Buckets:
- [ ] Go to **Object Browser** (left menu)
- [ ] Should see buckets like:
  - [ ] `quarantine`
  - [ ] `validated-data`
  - [ ] `rejected-data` (names may vary based on your config)

**For Each Bucket:**
- [ ] Click on bucket name
- [ ] May see folders organized by date (e.g., `2025/12/29/`)
- [ ] May see files (CSV, JSON, etc.) if system has processed data
- [ ] Click on a file to preview or download

### Access Keys:
- [ ] Go to **Identity** → **Service Accounts** (left menu)
- [ ] Should see access keys used by the API
- [ ] Verify keys match your `.env` or `docker-compose.yml`

### Monitoring:
- [ ] Go to **Metrics** (left menu)
- [ ] Check **Total Storage**: Should show used space
- [ ] Check **API Calls**: Should increment if API is accessing storage

**What to Look For:**
- ✅ Buckets created (may be auto-created on first use)
- ✅ Files organized by date/time
- ✅ Can preview/download files
- ❌ "Access Denied" errors
- ❌ Buckets missing

---

## 5️⃣ Grafana (http://localhost:3001)

### Login:
- [ ] Username: `admin`
- [ ] Password: `admin`
- [ ] You'll be prompted to change password (can skip for now)

### Data Source:
- [ ] Go to **Configuration** → **Data Sources** (left menu)
- [ ] Click on "Prometheus"
- [ ] Scroll down and click **Test**
- [ ] Should say: "Data source is working"

### Dashboards:
- [ ] Go to **Dashboards** (left menu, four-squares icon)
- [ ] Look for DataQuarantine dashboards (if pre-configured)
- [ ] Click on a dashboard

**What to Check on Dashboards:**
- [ ] Graphs are loading (not just "No data")
- [ ] Time range is set appropriately (top-right, try "Last 1 hour")
- [ ] Metrics are showing:
  - [ ] API request rate
  - [ ] Error rate (should be very low)
  - [ ] Database connections
  - [ ] Kafka message throughput

### Explore (Manual Query):
- [ ] Go to **Explore** (left menu, compass icon)
- [ ] Data source: Prometheus
- [ ] Enter query: `up`
- [ ] Click **Run Query** (top-right)
- [ ] Should see services with value `1` (up) or `0` (down)

**Try These Queries:**
```promql
# All services status
up

# API specific
up{job="api"}

# HTTP requests total
http_requests_total

# Database connections
pg_stat_database_numbackends
```

**What to Look For:**
- ✅ Data source connected
- ✅ Graphs showing data
- ✅ Services showing as "up" (value = 1)
- ❌ "No data" errors
- ❌ All services showing value = 0

---

## 6️⃣ Prometheus (http://localhost:9090)

### Targets:
- [ ] Go to **Status** → **Targets** (top menu)
- [ ] Should see all monitored services
- [ ] Each target should have:
  - [ ] State: **UP** (green)
  - [ ] Last Scrape: < 30 seconds ago
  - [ ] Health: No errors

**Common Targets:**
- [ ] `api` - Your FastAPI backend
- [ ] `kafka` - Kafka metrics exporter (if configured)
- [ ] `postgres` - PostgreSQL exporter (if configured)

### Graph:
- [ ] Go to **Graph** tab (top menu)
- [ ] Enter query: `up`
- [ ] Click **Execute**
- [ ] Switch to **Graph** tab (below query box)
- [ ] Should see line graph with values at 1 for all services

**Try These Queries:**
```promql
# API health
up{job="api"}

# Total HTTP requests
http_requests_total

# Request duration
http_request_duration_seconds

# Active database connections
pg_stat_activity_count
```

**What to Look For:**
- ✅ All targets showing "UP" in green
- ✅ Recent scrape times (< 30 sec)
- ✅ Queries returning data
- ❌ Targets showing "DOWN" in red
- ❌ "Context deadline exceeded" errors

---

## 7️⃣ PostgreSQL (DBeaver)

### Connection:
- [ ] Open DBeaver
- [ ] Create new connection (PostgreSQL)
- [ ] Enter details:
  - Host: `localhost`
  - Port: `5432`
  - Database: `dataquarantine`
  - Username: `quarantine_user`
  - Password: `quarantine_pass`
- [ ] Test Connection → Should succeed
- [ ] Click Finish

### Database Structure:
- [ ] Expand **dataquarantine** → **Schemas** → **public** → **Tables**
- [ ] Should see tables like:
  - [ ] `quarantine_records`
  - [ ] `validation_rules`
  - [ ] `audit_logs`
  - [ ] Others based on your schema

### Table Contents:
For each table:
- [ ] Right-click → **View Data**
- [ ] Should see columns and rows (may be empty if no data yet)

### Run Test Queries:

**1. List all tables:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```
- [ ] Query executes successfully
- [ ] Returns list of tables

**2. Count records:**
```sql
SELECT COUNT(*) FROM quarantine_records;
```
- [ ] Query executes successfully
- [ ] Returns a number (may be 0)

**3. View recent records:**
```sql
SELECT * FROM quarantine_records 
ORDER BY created_at DESC 
LIMIT 10;
```
- [ ] Query executes successfully
- [ ] Returns up to 10 rows (if data exists)

**4. Check schema:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'quarantine_records'
ORDER BY ordinal_position;
```
- [ ] Query executes successfully
- [ ] Returns column definitions

**What to Look For:**
- ✅ Connection successful
- ✅ Tables exist
- ✅ Queries execute without errors
- ✅ Data types match expectations
- ❌ "relation does not exist" errors
- ❌ "password authentication failed"

---

## 8️⃣ Integration Flow Test

This tests the entire data flow from end to end.

### Test Setup:
1. **Clear Previous Data** (optional):
   ```sql
   TRUNCATE TABLE quarantine_records;
   ```

2. **Prepare Test Data**:
   - Create a sample CSV or JSON file with intentionally bad data
   - Or use Swagger UI to submit test data via POST endpoint

### Test Execution:

**Step 1: Submit Data**
- [ ] Send data via Frontend UI or API (Swagger UI)
- [ ] Check response: Should be 200/201
- [ ] Note any returned ID or reference

**Step 2: Check Kafka**
- [ ] Go to Kafka UI → Topics → `quarantine-events`
- [ ] Click **Messages** tab → **Fetch Messages**
- [ ] Should see new message with your test data
- [ ] Message timestamp should match submission time

**Step 3: Check Database**
- [ ] In DBeaver, run:
   ```sql
   SELECT * FROM quarantine_records 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```
- [ ] Should see your test record
- [ ] Verify fields are populated correctly
- [ ] Check `status` field (e.g., "quarantined", "pending")

**Step 4: Check Storage (MinIO)**
- [ ] Go to MinIO Console → Buckets → `quarantine`
- [ ] Navigate to today's folder (e.g., `2025/12/29/`)
- [ ] Should see a file related to your test data
- [ ] Download and verify contents

**Step 5: Check Metrics**
- [ ] Go to Prometheus → Graph
- [ ] Query: `http_requests_total{endpoint="/quarantine"}`
- [ ] Should show counter has increased
- [ ] Go to Grafana → Check relevant dashboard
- [ ] Should see spike in request graph

**What to Look For:**
- ✅ Data flows from Frontend → API → Kafka → Database → MinIO
- ✅ Each step completes within seconds
- ✅ Metrics update in Prometheus/Grafana
- ❌ Data missing at any step
- ❌ Errors in logs

---

## 🔍 Final System Health Check

Run this after completing all above tests:

### Docker Health:
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```
- [ ] All 8 containers show "Up" status
- [ ] No "(unhealthy)" status
- [ ] No "(restarting)" loops

### Service Health:
- [ ] API: http://localhost:8080/docs → Loads
- [ ] Frontend: http://localhost:3000 → Loads
- [ ] Kafka UI: http://localhost:8090 → Shows cluster online
- [ ] Grafana: http://localhost:3001 → Dashboards load
- [ ] MinIO: http://localhost:9001 → Console loads
- [ ] Prometheus: http://localhost:9090/targets → All targets UP

### Logs Review:
```bash
docker-compose logs --tail=20 api
```
- [ ] No ERROR level messages in last 20 lines
- [ ] No stack traces

### Database Connectivity:
- [ ] DBeaver connection still active
- [ ] Can run queries without timeout

---

## 📊 Expected Results Summary

| Component | Expected State |
|-----------|----------------|
| **Containers** | 8 running, 0 unhealthy |
| **Frontend** | Loads in < 3 seconds |
| **API** | Responds in < 1 second |
| **Kafka Topics** | 3+ topics created |
| **Kafka Messages** | Incrementing (if active) |
| **MinIO Buckets** | 2-3 buckets exist |
| **Database Tables** | 5+ tables exist |
| **Prometheus Targets** | All UP (green) |
| **Grafana Dashboards** | Showing data |

---

## 🚨 If Tests Fail

### General Approach:
1. **Note what failed**: Write down the exact error message
2. **Check logs**: `docker logs <container-name> --tail 50`
3. **Verify dependencies**: Is the required service running?
4. **Restart service**: `docker-compose restart <service-name>`
5. **Full restart**: `docker-compose down && docker-compose up -d`

### Specific Failures:

**"Can't connect to database"**
→ Check Postgres: `docker logs dataquarantine-postgres`

**"Kafka not responding"**
→ Wait 2 minutes (Kafka is slow to start)
→ Check: `docker logs dataquarantine-kafka`

**"API returns 500"**
→ Check API logs: `docker logs dataquarantine-api`
→ Look for Python exceptions

**"No data in Grafana"**
→ Change time range to "Last 15 minutes"
→ Check Prometheus targets are UP

**"MinIO access denied"**
→ Verify credentials: minioadmin/minioadmin
→ Check API has correct MinIO env vars

---

## ✅ All Tests Passed?

**Congratulations!** 🎉 Your DataQuarantine system is fully operational!

### Next Steps:
1. **Process Real Data**: Try uploading actual data files
2. **Monitor Performance**: Watch metrics in Grafana over time
3. **Explore Features**: Test different validation rules
4. **Build Dashboards**: Create custom Grafana dashboards
5. **Learn Tools**: Dive deeper into Kafka, MinIO, etc.

---

## 📚 Need Help?

- **See detailed guides**: `BEGINNER_GUIDE.md`
- **Quick commands**: `QUICK_REFERENCE.md`
- **Troubleshooting**: Check container logs first
- **Community**: Search for specific error messages online

---

**Last Updated**: 2025-12-29
**System Version**: DataQuarantine POC v1.0
