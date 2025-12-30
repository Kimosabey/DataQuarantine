# 📊 Grafana & Prometheus Setup Guide - DataQuarantine

**Complete guide to visualize and monitor your DataQuarantine system**

---

## 🎯 **What You'll Learn**

- Set up Prometheus data source in Grafana
- Create dashboards for DataQuarantine metrics
- Query and explore your system's performance
- Monitor validation rates, throughput, and errors

---

## 🚀 **Part 1: Access Grafana**

### Step 1: Open Grafana

```
URL: http://localhost:3001
Username: admin
Password: admin
```

### Step 2: First Login
1. Browser will open Grafana login page
2. Enter credentials: `admin` / `admin`
3. **Skip** password change (or change it if you want)
4. You'll see the Grafana home page

---

## 🔧 **Part 2: Configure Prometheus Data Source**

### Step 1: Add Prometheus Data Source

1. Click **☰ Menu** (hamburger icon, top left)
2. Go to **Connections** → **Data sources**
3. Click **+ Add new data source**
4. Search for and select **Prometheus**

### Step 2: Configure Prometheus

Enter these settings:

```yaml
Name: Prometheus-DataQuarantine
URL: http://prometheus:9090
Access: Server (default)
```

**Important Settings:**
- **HTTP Method**: `GET`
- **Timeout**: `60` (seconds)
- Leave everything else as default

### Step 3: Test & Save

1. Scroll to bottom
2. Click **Save & Test**
3. You should see: ✅ **"Data source is working"**

---

## 📊 **Part 3: Explore Metrics in Prometheus UI**

Before creating dashboards, let's explore what metrics we have!

### Step 1: Open Prometheus

```
URL: http://localhost:9090
```

### Step 2: Explore Available Metrics

Click **Graph** tab, then in the query box try these:

#### **1. Total Messages Processed**
```promql
dataquarantine_records_processed_total
```
**What it shows**: Total number of messages your system has validated

---

#### **2. Valid Messages Count**
```promql
dataquarantine_records_valid_total
```
**What it shows**: Total valid messages routed successfully

---

#### **3. Invalid Messages Count**
```promql
dataquarantine_records_invalid_total
```
**What it shows**: Total invalid messages quarantined

---

#### **4. Success Rate (Percentage)**
```promql
(dataquarantine_records_valid_total / dataquarantine_records_processed_total) * 100
```
**What it shows**: Percentage of valid messages (quality metric)

---

#### **5. Processing Rate (Messages/Second)**
```promql
rate(dataquarantine_records_processed_total[1m])
```
**What it shows**: How many messages per second in last minute

---

#### **6. Consumer Lag (if available)**
```promql
dataquarantine_consumer_lag
```
**What it shows**: How far behind your consumer is from producers

---

## 🎨 **Part 4: Create Your First Grafana Dashboard**

### Step 1: Create New Dashboard

1. Click **☰ Menu** → **Dashboards**
2. Click **+ Create Dashboard** (blue button)
3. Click **+ Add visualization**
4. Select **Prometheus-DataQuarantine** as data source

---

### Step 2: Panel 1 - Total Messages Processed

**Panel Title**: Total Messages Processed

**Query**:
```promql
dataquarantine_records_processed_total
```

**Visualization Settings**:
- Visualization type: **Stat** (big number)
- Unit: **Short**
- Color scheme: **Green**

Click **Apply** to save panel.

---

### Step 3: Panel 2 - Success Rate

1. Click **Add** → **Visualization**
2. **Panel Title**: Validation Success Rate

**Query**:
```promql
(dataquarantine_records_valid_total / dataquarantine_records_processed_total) * 100
```

**Visualization Settings**:
- Type: **Gauge**
- Unit: **Percent (0-100)**
- Thresholds:
  - 0-70: Red
  - 70-85: Yellow  
  - 85-100: Green

---

### Step 4: Panel 3 - Messages Over Time

1. Add new visualization
2. **Panel Title**: Message Processing Rate

**Query**:
```promql
rate(dataquarantine_records_processed_total[5m])
```

**Visualization Settings**:
- Type: **Time series** (graph)
- Unit: **Messages/sec**
- Legend: Show

---

### Step 5: Panel 4 - Valid vs Invalid (Pie Chart)

1. Add new visualization
2. **Panel Title**: Message Distribution

**Queries** (add multiple):

Query A - Valid:
```promql
dataquarantine_records_valid_total
```

Query B - Invalid:
```promql
dataquarantine_records_invalid_total
```

**Visualization Settings**:
- Type: **Pie chart**
- Legend: Right side
- Values: True

---

### Step 6: Panel 5 - Error Types Breakdown

1. Add new visualization
2. **Panel Title**: Error Types

**Query**:
```promql
dataquarantine_errors_by_type
```

**Visualization Settings**:
- Type: **Bar chart**
- Show legend

---

### Step 7: Save Your Dashboard

1. Click **💾 Save dashboard** (top right)
2. **Name**: `DataQuarantine - Main Dashboard`
3. **Folder**: General
4. Click **Save**

---

## 📈 **Part 5: Advanced Dashboards**

### Dashboard 2: System Health

Create panels for:

#### **1. API Response Time**
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

#### **2. Error Rate**
```promql
rate(dataquarantine_errors_total[5m])
```

#### **3. Kafka Consumer Lag**
```promql
dataquarantine_consumer_lag{topic="raw-events"}
```

---

### Dashboard 3: Business Metrics

#### **1. Messages by Schema**
```promql
dataquarantine_messages_by_schema
```

#### **2. Quarantine Trend (Last 24h)**
```promql
increase(dataquarantine_records_invalid_total[24h])
```

#### **3. Top Error Types**
```promql
topk(5, dataquarantine_errors_by_type)
```

---

## 🔍 **Part 6: Exploring Your Data**

### Use Prometheus **Explore** Feature

1. In Grafana, click **☰** → **Explore**
2. Select **Prometheus-DataQuarantine**
3. Try these queries:

#### **Find All Metrics**
```promql
{__name__=~"dataquarantine.*"}
```

#### **Recent Validation Activity**
```promql
delta(dataquarantine_records_processed_total[5m])
```

#### **Hourly Throughput**
```promql
rate(dataquarantine_records_processed_total[1h])
```

---

## 📊 **Part 7: Create Alerts**

### Alert 1: High Error Rate

1. Edit any panel showing error rate
2. Click **Alert** tab
3. **Create alert rule**

**Condition**:
```
WHEN avg() OF query(A, 5m) IS ABOVE 0.3
```

**Meaning**: Alert if >30% messages are invalid

---

### Alert 2: Consumer Lag

**Condition**:
```promql
dataquarantine_consumer_lag > 1000
```

**Meaning**: Alert if consumer is >1000 messages behind

---

## 🎯 **Part 8: Real-World Scenarios**

### Scenario 1: Monitor Live Traffic

While `simulate_traffic.py` is running:

1. Open Grafana dashboard
2. Set time range to **Last 5 minutes**
3. Enable **Auto-refresh** (top right) to **5s**
4. Watch metrics update in real-time!

---

### Scenario 2: Investigate Performance Issues

**Question**: Why is validation slow?

**Steps**:
1. Check **Processing Rate** panel
2. Query: `rate(dataquarantine_records_processed_total[1m])`
3. If low → Check consumer lag
4. If high lag → Scale up consumers

---

### Scenario 3: Data Quality Monitoring

**Question**: Are we getting more invalid data?

**Steps**:
1. Create panel with:
   ```promql
   increase(dataquarantine_records_invalid_total[1h])
   ```
2. Set alert if increase > threshold
3. Investigate error types

---

## 🎨 **Part 9: Dashboard Templates**

### Template 1: Operations Dashboard

**Panels**:
- System uptime
- Message throughput
- Error rate
- Consumer lag
- API health

---

### Template 2: Business Dashboard

**Panels**:
- Total messages today
- Success rate %
- Top error types
- Messages by schema
- Hourly trend

---

## 💡 **Part 10: Pro Tips**

### **Tip 1: Use Variables**

Create dashboard variables for:
- Time range
- Topic name
- Environment

**How**:
1. Dashboard settings → **Variables**
2. Add variable: `topic`
3. Query: `label_values(dataquarantine_records_total, topic)`
4. Use in queries: `{topic="$topic"}`

---

### **Tip 2: Time Range Zoom**

- Click and drag on any graph to zoom
- Double-click to reset
- Use time picker (top right) for presets

---

### **Tip 3: Share Dashboards**

1. Click **Share** icon (top right)
2. **Link**: Copy URL
3. **Snapshot**: Create permanent snapshot
4. **Export**: Download JSON

---

## 🧪 **Part 11: Test Your Setup**

Run this checklist:

```powershell
# 1. Start traffic generator
python scripts/simulate_traffic.py

# 2. Open Grafana
start http://localhost:3001

# 3. Go to your dashboard

# 4. Verify you see:
✅ Total messages increasing
✅ Success rate around 75%
✅ Processing rate around 10 msg/sec
✅ Pie chart showing 75% valid, 25% invalid
```

---

## 📚 **Part 12: Useful PromQL Queries**

### **Performance Queries**

```promql
# Average processing time
avg(dataquarantine_processing_duration_seconds)

# 95th percentile latency
histogram_quantile(0.95, rate(dataquarantine_latency_bucket[5m]))

# Requests per second
rate(dataquarantine_requests_total[1m])
```

---

### **Business Queries**

```promql
# Success rate over 24h
avg_over_time((dataquarantine_records_valid_total / dataquarantine_records_processed_total)[24h:5m]) * 100

# Messages per hour
increase(dataquarantine_records_processed_total[1h])

# Invalid messages today
increase(dataquarantine_records_invalid_total[1d])
```

---

## 🎬 **Quick Start Checklist**

- [ ] Access Grafana (http://localhost:3001)
- [ ] Login with admin/admin
- [ ] Add Prometheus data source (http://prometheus:9090)
- [ ] Test data source connection
- [ ] Explore metrics in Prometheus UI (http://localhost:9090)
- [ ] Create first dashboard with 5 panels
- [ ] Run traffic simulation
- [ ] Watch metrics update in real-time
- [ ] Save dashboard
- [ ] Share with team!

---

## 🆘 **Troubleshooting**

### **No Data in Grafana?**

1. Check Prometheus is running: http://localhost:9090
2. Verify data source URL: `http://prometheus:9090`
3. Test query in Prometheus first
4. Check time range in Grafana (last 5 mins)

---

### **Metrics Not Showing?**

1. Verify traffic is running: `python scripts/simulate_traffic.py`
2. Check API logs: `docker logs dataquarantine-api`
3. Prometheus targets: http://localhost:9090/targets
4. Should see `dataquarantine-api` as UP

---

## 🎉 **You're Ready!**

**Now you can**:
- ✅ Monitor your system in real-time
- ✅ Create beautiful dashboards
- ✅ Set up alerts
- ✅ Analyze performance trends
- ✅ Present metrics to stakeholders

---

**Happy Monitoring! 📊🚀**
