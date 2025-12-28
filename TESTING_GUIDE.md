# 🔍 DataQuarantine - Complete End-to-End Testing Guide

**Test Date**: December 28, 2025  
**Your Mission**: Verify every component is working and data is flowing correctly!

---

## 📋 **Pre-Check: Services Running**

```powershell
cd "G:\LearningRelated\Portfolio Project\DataQuarantine"
docker-compose ps
```

✅ **All 8 services should show "Up"**

---

## 1️⃣ **DBeaver (PostgreSQL Database)**

### **Connection Details**
- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `dataquarantine`
- **Username**: `quarantine_user`
- **Password**: `quarantine_pass`

### **What to Check**

#### **Step 1: Connect in DBeaver**
1. Open DBeaver
2. Click **New Database Connection**
3. Select **PostgreSQL**
4. Enter connection details above
5. Click **Test Connection** → should succeed
6. Click **Finish**

#### **Step 2: Verify Tables Created**
Run this query:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

✅ **Expected Tables**:
- `quarantine_records`
- `schemas`
- `validation_metrics`
- `reprocessing_log`

#### **Step 3: Check if Quarantine Records Are Being Saved**
```sql
-- Count total quarantined records
SELECT COUNT(*) as total_quarantined 
FROM quarantine_records;

-- View latest 10 quarantined records
SELECT 
    id,
    topic,
    error_type,
    error_message,
    created_at
FROM quarantine_records
ORDER BY created_at DESC
LIMIT 10;
```

✅ **Expected**: After running simulation, you should see records here

#### **Step 4: Check Error Type Distribution**
```sql
-- Group by error type
SELECT 
    error_type,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM quarantine_records
GROUP BY error_type
ORDER BY count DESC;
```

✅ **Expected**: Distribution of 7 error types from simulation

---

## 2️⃣ **MinIO (Object Storage)**

### **Access Details**
- **URL**: http://localhost:9001
- **Username**: `minioadmin`
- **Password**: `minioadmin`

### **What to Check**

#### **Step 1: Login**
1. Open browser → http://localhost:9001
2. Login with `minioadmin` / `minioadmin`

#### **Step 2: Create Bucket (If Needed)**
1. Click **Buckets** in left menu
2. Click **Create Bucket**
3. Name: `data-quarantine`
4. Click **Create**

#### **Step 3: Verify Structure**
Expected folder structure:
```
data-quarantine/
├── quarantine/
│   ├── raw-events/
│   │   ├── 1234.json
│   │   ├── 1235.json
│   │   └── ...
```

✅ **Expected**: After simulation runs, JSON files should appear here with invalid message payloads

#### **Step 4: Download and Inspect a File**
1. Navigate to a `.json` file
2. Click **Download**
3. Open in text editor
4. ✅ Should contain the original invalid message + error metadata

---

## 3️⃣ **Prometheus (Metrics Collection)**

### **Access Details**
- **URL**: http://localhost:9090

### **What to Check**

#### **Step 1: Verify Targets**
1. Open http://localhost:9090
2. Click **Status** → **Targets**
3. ✅ Should see `dataquarantine-api` with state **UP**

#### **Step 2: Query Processed Records**
1. Click **Graph** tab
2. Enter query:
```promql
dataquarantine_records_processed_total
```
3. Click **Execute**
4. ✅ Should show increasing count (after simulation runs)

#### **Step 3: Query Valid vs Invalid**
**Valid records**:
```promql
dataquarantine_records_valid_total
```

**Invalid records**:
```promql
dataquarantine_records_invalid_total
```

**Success Rate** (calculated):
```promql
(dataquarantine_records_valid_total / dataquarantine_records_processed_total) * 100
```

✅ **Expected**: ~75% success rate (from simulation)

#### **Step 4: Check Error Breakdown**
```promql
dataquarantine_records_invalid_total
```
Then click **Table** tab to see breakdown by:
- `error_type`
- `schema`
- `topic`

---

## 4️⃣ **Grafana (Visualization)**

### **Access Details**
- **URL**: http://localhost:3001
- **Username**: `admin`
- **Password**: `admin`

### **What to Check**

#### **Step 1: Login**
1. Open http://localhost:3001
2. Login with `admin` / `admin`
3. Skip password change (for demo)

#### **Step 2: Add Prometheus Data Source**
1. Click **⚙️ (gear icon)** → **Data Sources**
2. Click **Add data source**
3. Select **Prometheus**
4. **URL**: `http://prometheus:9090`
5. Click **Save & Test**
6. ✅ Should show "Data source is working"

#### **Step 3: Create Dashboard (Optional)**
1. Click **+** → **Dashboard**
2. Click **Add visualization**
3. Select **Prometheus** data source
4. Enter query:
```promql
rate(dataquarantine_records_processed_total[1m])
```
5. **Panel title**: "Processing Rate (per minute)"
6. Click **Apply**

#### **Step 4: Suggested Panels**

**Panel 1: Total Records Processed**
```promql
dataquarantine_records_processed_total
```
- Visualization: **Stat**
- Title: "Total Processed"

**Panel 2: Success Rate**
```promql
(dataquarantine_records_valid_total / dataquarantine_records_processed_total) * 100
```
- Visualization: **Gauge**
- Title: "Success Rate %"
- Min: 0, Max: 100

**Panel 3: Error Breakdown**
```promql
dataquarantine_records_invalid_total
```
- Visualization: **Pie Chart**
- Legend: `{{error_type}}`
- Title: "Errors by Type"

**Panel 4: Processing Rate (Time Series)**
```promql
rate(dataquarantine_records_processed_total[5m])
```
- Visualization: **Time series**
- Title: "Messages/sec"

---

## 5️⃣ **Kafka UI (Message Broker)**

### **Access Details**
- **URL**: http://localhost:8090

### **What to Check**

#### **Step 1: Verify Topics**
1. Open http://localhost:8090
2. Click **Topics**
3. ✅ Should see 3 topics:
   - `raw-events` (input)
   - `validated-events` (valid output)
   - `quarantine-dlq` (invalid output)

#### **Step 2: Check Message Flow**
**Topic: raw-events**
- Click **Messages** tab
- ✅ Should see incoming messages (during simulation)

**Topic: validated-events**
- Click **Messages** tab
- ✅ Should see ~75% of messages (valid ones)

**Topic: quarantine-dlq**
- Click **Messages** tab
- ✅ Should see ~25% of messages (invalid ones)
- Each message should have:
  - `original_message`
  - `validation_error`
  - `source_topic`
  - `source_partition`
  - `source_offset`

#### **Step 3: Monitor Consumer Lag**
1. Click **Consumers** tab
2. Find `dataquarantine-validators` group
3. ✅ Lag should be **0** or very low (< 100)

---

## 6️⃣ **Next.js Dashboard (UI)**

### **Access Details**
- **URL**: http://localhost:3000
- Running locally with `npm run dev`

### **What to Check**

#### **Step 1: Dashboard View**
✅ **Verify**:
- 4 animated stat cards showing metrics
- Validation rate chart (area chart)
- Error breakdown (pie/gauge chart)
- System status (4 services with green dots)

#### **Step 2: Quarantine Browser**
1. Click **Quarantine** in sidebar
2. ✅ **Verify**:
   - Table shows quarantined records
   - Search bar works
   - Filters work (topic, error type)
   - Pagination works
   - Error badges show different colors

#### **Step 3: Check API Integration**
1. Open browser console (F12)
2. Go to **Network** tab
3. Refresh page
4. ✅ Should see:
   - `GET /api/metrics` → 200 OK
   - `GET /api/quarantine/records` → 200 OK

---

## 🚀 **Complete Test Flow**

### **Run this complete test sequence:**

```powershell
# Terminal 1: Backend Services
cd "G:\LearningRelated\Portfolio Project\DataQuarantine"
docker-compose up -d

# Terminal 2: Frontend UI
cd dataquarantine-ui
npm run dev

# Terminal 3: Traffic Simulation
cd ..
python scripts\simulate_traffic.py
# Let it run for 30 seconds (300 messages)
# Press Ctrl+C to stop
```

### **Then verify in order:**

1. ✅ **Kafka UI** (http://localhost:8090)
   - See messages flowing through all 3 topics

2. ✅ **DBeaver/PostgreSQL**
   - Run: `SELECT COUNT(*) FROM quarantine_records;`
   - Should see records appearing

3. ✅ **MinIO** (http://localhost:9001)
   - Check `data-quarantine` bucket for JSON files

4. ✅ **Prometheus** (http://localhost:9090)
   - Query: `dataquarantine_records_processed_total`
   - Should show increasing numbers

5. ✅ **Grafana** (http://localhost:3001)
   - Create panels with queries above
   - Visualize metrics in real-time

6. ✅ **Next.js Dashboard** (http://localhost:3000)
   - See animated metrics
   - Browse quarantined records

---

## 📊 **Expected Results After 30-Second Simulation**

| Metric | Expected Value |
|--------|----------------|
| **Total Messages** | ~300 |
| **Valid Messages** | ~225 (75%) |
| **Invalid Messages** | ~75 (25%) |
| **PostgreSQL Records** | ~75 rows in `quarantine_records` |
| **MinIO Files** | ~75 JSON files |
| **Consumer Lag** | 0 (all processed) |

---

## ✅ **Final Verification Checklist**

- [ ] All 8 Docker containers running
- [ ] DBeaver connected to PostgreSQL
- [ ] Quarantine records visible in database
- [ ] MinIO bucket contains JSON files
- [ ] Prometheus shows metrics
- [ ] Grafana connected to Prometheus
- [ ] Kafka UI shows 3 topics with messages
- [ ] Next.js UI loads and displays data
- [ ] Simulation script runs without errors
- [ ] Consumer lag is 0 or minimal

---

**🎉 When all boxes are checked, you're ready to demo!**

---

## 🎬 **Demo Script (5 Minutes)**

1. **Start**: "Let me show you how DataQuarantine handles streaming validation..."

2. **Run Simulation**: `python scripts\simulate_traffic.py`

3. **Show Kafka UI**: Messages flowing through pipeline

4. **Show Next.js Dashboard**: Real-time metrics updating

5. **Show DBeaver**: Quarantined records in database

6. **Show Prometheus**: Query metrics directly

7. **Show Grafana**: Beautiful visualizations

8. **Close**: "This demonstrates real-time data quality enforcement with zero data loss!"

---

**Built with ❤️ for data quality and beautiful demos**
