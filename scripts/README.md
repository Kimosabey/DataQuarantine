# 🚀 DataQuarantine Test Scripts

This folder contains scripts for testing and simulating the DataQuarantine system.

---

## 📂 Available Scripts

### 1️⃣ **simulate_traffic.py** - Continuous Traffic Generator 🔄

**Purpose**: Generate continuous, realistic traffic for live testing and demonstration

**What it does**:
- Runs **forever** (until you stop it with Ctrl+C)
- Sends messages at **10/second** (configurable)
- **75% valid** / **25% invalid** ratio
- Randomized error types

**When to use**:
- Live demos
- Load testing
- Observing real-time metrics in Grafana
- Filling up Kafka topics with realistic data

**How to run**:
```bash
cd d:\01_Projects\Personal\POCs\DataQuarantine
python scripts/simulate_traffic.py
```

**Example output**:
```
[00010] [VALID] | Valid: 8 | Invalid: 2 | Success Rate: 80.0%
[00020] [INVALID] | Valid: 15 | Invalid: 5 | Success Rate: 75.0%
[00030] [VALID] | Valid: 22 | Invalid: 8 | Success Rate: 73.3%
...
```

---

### 2️⃣ **test_validation.py** - One-Time Validation Test ✅

**Purpose**: Send specific test cases to verify validation logic

**What it does**:
- Sends exactly **7 messages** (2 valid + 5 invalid)
- Each invalid message tests a **different error type**
- Stops automatically after sending all messages
- Perfect for **CI/CD testing**

**When to use**:
- Testing specific validation scenarios
- Verifying fix for a bug
- Quick smoke test
- Automated testing

**How to run**:
```bash
cd d:\01_Projects\Personal\POCs\DataQuarantine
python scripts/test_validation.py
```

**Test cases**:
1. ✅ Valid purchase event
2. ✅ Valid click event  
3. ❌ Missing `user_id`
4. ❌ Invalid `user_id` format
5. ❌ Invalid `event_type` enum
6. ❌ Missing `timestamp`
7. ❌ Missing `_schema` field

---

## 🎯 Quick Comparison

| Feature           | simulate_traffic.py  | test_validation.py    |
| ----------------- | -------------------- | --------------------- |
| **Duration**      | Continuous (forever) | One-time (7 messages) |
| **Speed**         | 10 msg/sec           | Instant               |
| **Purpose**       | Live demo, load test | Validation testing    |
| **Messages**      | Random, realistic    | Fixed test cases      |
| **Valid/Invalid** | 75/25 ratio          | 2/5 specific cases    |
| **Use case**      | Show system working  | Verify logic works    |

---

## 📊 What to Check After Running

### After **simulate_traffic.py**:

1. **Kafka UI** (http://localhost:8090)
   - Watch message counts increase
   - See topics fill up in real-time

2. **Grafana** (http://localhost:3001)
   - Observe validation rate metrics
   - Monitor throughput graphs

3. **MinIO** (http://localhost:9001)
   - See quarantined files accumulate
   - Check bucket size growing

4. **Frontend** (http://localhost:3000)
   - View live quarantine feed
   - See charts update in real-time

---

### After **test_validation.py**:

1. **Kafka UI** (http://localhost:8090)
   - Verify exactly 7 messages in raw-events
   - Check 2 in validated-events
   - Check 5 in quarantine-dlq

2. **PostgreSQL** (DBeaver)
   ```sql
   SELECT * FROM quarantine_records;
   ```
   Should show **5 records** with different error types

3. **API Logs**
   ```bash
   docker logs dataquarantine-api --tail 50
   ```
   Review validation results for each message

---

## 🛠️ Requirements

Both scripts require:
```bash
pip install kafka-python
```

**System requirements**:
- Kafka running on `localhost:9092`
- All DataQuarantine services started

**Start services**:
```bash
docker-compose up -d
```

---

## 💡 Pro Tips

### **For Continuous Monitoring**:
```bash
# Terminal 1: Run traffic generator
python scripts/simulate_traffic.py

# Terminal 2: Watch API logs
docker logs -f dataquarantine-api

# Terminal 3: Monitor Kafka UI
start http://localhost:8090
```

### **For Quick Testing**:
```bash
# Run test
python scripts/test_validation.py

# Check results immediately
docker exec dataquarantine-kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic quarantine-dlq \
  --from-beginning \
  --max-messages 5
```

---

## 🎓 Learning Path

1. **First time**: Run `test_validation.py` to understand the basics
2. **Exploration**: Run `simulate_traffic.py` for 1 minute, observe in Kafka UI
3. **Deep dive**: Run `simulate_traffic.py` for 10 minutes, monitor in Grafana
4. **Mastery**: Modify scripts to test your own scenarios

---

**Happy Testing! 🚀**
