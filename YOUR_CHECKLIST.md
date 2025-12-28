# ✅ DataQuarantine - YOUR TESTING CHECKLIST

**Date**: December 28, 2025 22:30 IST  
**Status**: ✅ ALL SYSTEMS READY FOR TESTING

---

## 🚀 **STEP-BY-STEP TESTING WORKFLOW**

### **1. Start Everything (Already Done!)**

✅ **Backend Services** (Docker):
```powershell
cd "G:\LearningRelated\Portfolio Project\DataQuarantine"
docker-compose ps  # Verify all 8 services are "Up"
```

✅ **Frontend** (Run this now if not running):
```powershell
cd dataquarantine-ui
npm run dev
# Opens at http://localhost:3000
```

---

### **2. Run Simulation for 30 Seconds**

```powershell
cd "G:\LearningRelated\Portfolio Project\DataQuarantine"
python scripts\simulate_traffic.py
```

**Let it run for 30 seconds** (you'll see):
```
[00010] ✅ [VALID] | Valid: 8 | Invalid: 2 | Success Rate: 80.0%
[00020] ❌ [INVALID] | Valid: 15 | Invalid: 5 | Success Rate: 75.0%
```

**Then press Ctrl+C**

---

### **3. DBeaver Testing** 🗄️

#### **Connect**:
- Host: `localhost`
- Port: `5432`
- Database: `dataquarantine`
- User: `quarantine_user`
- Password: `quarantine_pass`

#### **Run These Queries**:

```sql
-- 1. Count quarantined records (should be ~75 after 30sec)
SELECT COUNT(*) FROM quarantine_records;

-- 2. See latest 10 invalid records
SELECT 
    error_type,
    error_message,
    created_at
FROM quarantine_records
ORDER BY created_at DESC
LIMIT 10;

-- 3. Error distribution
SELECT 
    error_type,
    COUNT(*) as count
FROM quarantine_records
GROUP BY error_type
ORDER BY count DESC;
```

✅ **Expected**: 7 different error types

---

### **4. MinIO Testing** 📦

1. Open: http://localhost:9001
2. Login: `minioadmin` / `minioadmin`
3. Click **Buckets**
4. Look for `data-quarantine` bucket
5. Browse folders: `quarantine/raw-events/`
6. ✅ Should see JSON files with invalid messages

**Note**: MinIO storage is currently in the code but files may not appear yet (we're saving to PostgreSQL for now). Focus on DB and metrics.

---

### **5. Prometheus Testing** 📊

1. Open: http://localhost:9090
2. Click **Graph** tab

#### **Run These Queries**:

```promql
# Total processed
dataquarantine_records_processed_total

# Valid records
dataquarantine_records_valid_total

# Invalid records  
dataquarantine_records_invalid_total

# Success rate (%)
(dataquarantine_records_valid_total / dataquarantine_records_processed_total) * 100
```

✅ **Expected**: Success rate around 75%

---

### **6. Grafana Setup** 📈

1. Open: http://localhost:3001
2. Login: `admin` / `admin` (skip password change)

#### **Add Prometheus Data Source**:
1. Click **⚙️** → **Data Sources**
2. Click **Add data source**
3. Select **Prometheus**
4. URL: `http://prometheus:9090`
5. Click **Save & Test**
6. ✅ Should say "Data source is working"

#### **Create Quick Dashboard**:
1. Click **+** → **Dashboard**
2. Click **Add visualization**
3. Select **Prometheus**
4. Add these panels:

**Panel 1: Total Processed**
- Query: `dataquarantine_records_processed_total`
- Visualization: **Stat**

**Panel 2: Success Rate**
- Query: `(dataquarantine_records_valid_total / dataquarantine_records_processed_total) * 100`
- Visualization: **Gauge**
- Min: 0, Max: 100

**Panel 3: Error Types**
- Query: `dataquarantine_records_invalid_total`
- Visualization: **Pie Chart**
- Legend: `{{error_type}}`

---

### **7. Kafka UI Check** 🎯

1. Open: http://localhost:8090
2. Go to **Topics**

✅ **Verify 3 topics exist**:
- `raw-events` (input from simulation)
- `validated-events` (valid messages)
- `quarantine-dlq` (invalid messages)

#### **Check Message Flow**:
- Click **raw-events** → **Messages**
  - Should see all messages

- Click **validated-events** → **Messages**
  - Should see ~75% of messages

- Click **quarantine-dlq** → **Messages**
  - Should see ~25% of messages
  - Each has `original_message` + `validation_error`

---

### **8. Next.js Dashboard** 🎨

1. Open: http://localhost:3000
2. ✅ **Check Dashboard**:
   - 4 animated stat cards
   - Validation rate chart
   - Error breakdown chart
   - System status (4 green dots)

3. Click **Quarantine** in sidebar
4. ✅ **Check Quarantine Browser**:
   - Table shows records
   - Filter by error type
   - Search works
   - Pagination works

---

## 📋 **Final Verification Checklist**

Run through this list:

### **Services**
- [ ] 8 Docker containers running (`docker-compose ps`)
- [ ] Next.js UI running locally (http://localhost:3000)
- [ ] Simulation completed successfully (~300 messages)

### **DBeaver/PostgreSQL**
- [ ] Connected to database
- [ ] `quarantine_records` table has ~75 rows
- [ ] Can see 7 different error types
- [ ] Timestamps are recent

### **Prometheus**  
- [ ] Can access UI (http://localhost:9090)
- [ ] Query returns data for processed records
- [ ] Success rate shows ~75%

### **Grafana**
- [ ] Can login (http://localhost:3001)
- [ ] Prometheus data source connected
- [ ] Created at least 1 panel showing metrics

### **Kafka UI**
- [ ] Can access UI (http://localhost:8090)
- [ ] All 3 topics visible
- [ ] Messages distributed correctly (75/25 split)
- [ ] Consumer lag is 0 or minimal

### **Next.js Dashboard**
- [ ] Dashboard loads with animations
- [ ] Metrics display correctly
- [ ] Quarantine browser shows records
- [ ] Can filter and search

---

## 🎬 **WHEN EVERYTHING IS WORKING**

### **Take Screenshots of**:
1. DBeaver showing quarantine records
2. Grafana dashboard with 3 panels
3. Prometheus metrics
4. Kafka UI showing message distribution
5. Next.js Dashboard with charts
6. Next.js Quarantine browser

### **Record a 3-Minute Demo Video**:
1. Start simulation
2. Show Kafka UI → messages flowing
3. Show Next.js Dashboard → metrics updating
4. Show DBeaver → records in database
5. Show Grafana → beautiful charts

---

## 🎯 **YOUR WORKFLOW RIGHT NOW**

```powershell
# 1. Verify services
docker-compose ps

# 2. Start UI (if not running)
cd dataquarantine-ui
npm run dev

# 3. Open new terminal and run simulation
cd ..
python scripts\simulate_traffic.py
# Let it run 30 seconds, then Ctrl+C

# 4. Now test everything in this order:
# → DBeaver (SQL queries)
# → Prometheus (metrics queries)
# → Grafana (create dashboard)
# → Kafka UI (check topics)
# → Next.js Dashboard (browse UI)
```

---

## 📁 **Documentation Files**

- `TESTING_GUIDE.md` → Detailed step-by-step guide
- `E2E_TEST_REPORT.md` → Test results summary
- `STARTUP_GUIDE.md` → How to start everything
- `COMPLETE_SUMMARY.md` → Full project overview

---

**🚀 You're all set! Follow the checklist above and verify each component!**

**Questions? Check `TESTING_GUIDE.md` for detailed instructions!**
