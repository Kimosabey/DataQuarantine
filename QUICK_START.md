# 🚀 DataQu

arantine - Quick Start (Ultra-Fast)

**Get the entire system running in 3 commands!**

---

## ⚡ **Fastest Way to Start**

```powershell
# 1. Clone and navigate
git clone <your-repo-url>
cd DataQuarantine

# 2. Start everything (AUTOMATED!)
.\start.ps1

# 3. Open your browser
start http://localhost:3000
```

**That's it! Everything runs automatically!** 🎉

---

## 📋 **What `start.ps1` Does for You**

✅ Starts all 8 Docker services  
✅ Waits for health checks  
✅ Creates Kafka topics automatically  
✅ Creates MinIO buckets automatically  
✅ Verifies PostgreSQL connection  
✅ Shows all access URLs  

**NO MANUAL SETUP REQUIRED!**

---

## 🌐 **Access Your System**

After running `.\start.ps1`, open these URLs:

| Service        | URL                        | Credentials             |
| -------------- | -------------------------- | ----------------------- |
| **Frontend**   | http://localhost:3000      | None                    |
| **API Docs**   | http://localhost:8080/docs | None                    |
| **Kafka UI**   | http://localhost:8090      | None                    |
| **MinIO**      | http://localhost:9001      | minioadmin / minioadmin |
| **Grafana**    | http://localhost:3001      | admin / admin           |
| **Prometheus** | http://localhost:9090      | None                    |

---

## 🧪 **Run Tests**

### **Continuous Traffic (for demos)**
```powershell
python scripts/simulate_traffic.py
```
- Sends 10 messages/second continuously
- 75% valid / 25% invalid
- Great for live demos

### **Quick Validation Test**
```powershell
python scripts/test_validation.py
```
- Sends 7 specific test messages
- Tests all error types
- Perfect for CI/CD

---

## 🛑 **Stop Everything**

```powershell
.\stop.ps1
```

---

## 📊 **What You'll See**

### **After Starting:**
- **Kafka UI**: 3 topics (raw-events, validated-events, quarantine-dlq)
- **MinIO**: 2 buckets (data-quarantine, validated-data)
- **PostgreSQL**: quarantine_records table
- **Frontend**: Real-time dashboard

### **After Running Traffic:**
- **Valid messages** → validated-events (Kafka) + validated-data (MinIO)
- **Invalid messages** → quarantine-dlq (Kafka) + data-quarantine (MinIO) + PostgreSQL

---

## 🎯 **Next Time You Start**

**Just run:**
```powershell
.\start.ps1
```

Everything remembers your data from last time (Docker volumes persist)!

---

## 🔧 **Troubleshooting**

### **Services not starting?**
```powershell
docker-compose down
docker-compose up -d --build
```

### **Need fresh start?**
```powershell
docker-compose down -v  # ⚠️ Deletes all data!
.\start.ps1
```

### **Check logs:**
```powershell
docker logs dataquarantine-api
docker logs -f dataquarantine-kafka
```

---

## 📚 **More Documentation**

- **Full Guide**: `docs/QUICKSTART.md`
- **Architecture**: `docs/ARCHITECTURE_GUIDE.md`
- **API Details**: `docs/HLD.md` and `docs/LLD.md`
- **Scripts**: `scripts/README.md`

---

## ✅ **System Requirements**

- **Docker Desktop** (with Docker Compose)
- **Python 3.11+** (for test scripts)
- **Node.js 18+** (for frontend)
- **8GB RAM** recommended

---

**Everything is automated! Just run `.\start.ps1` and you're ready!** 🚀
