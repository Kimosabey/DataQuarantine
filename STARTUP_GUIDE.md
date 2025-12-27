# 🚀 DataQuarantine - Complete Startup Guide

**Follow these steps to run the ENTIRE system with the beautiful Next.js UI!**

---

## ✅ **Step 1: Install Next.js UI Dependencies**

```powershell
# Navigate to UI directory
cd "G:\LearningRelated\Portfolio Project\DataQuarantine\dataquarantine-ui"

# Install all dependencies
npm install

# Verify installation
npm list framer-motion
```

**Expected**: Should show framer-motion installed

---

## ✅ **Step 2: Start Next.js UI (Development)**

```powershell
# Still in dataquarantine-ui directory
npm run dev
```

**Expected Output**:
```
▲ Next.js 16.1.1
- Local:        http://localhost:3000
```

**Access**: http://localhost:3000

**Keep this terminal open!**

---

## ✅ **Step 3: Start Docker Services (New Terminal)**

Open a **NEW PowerShell terminal**:

```powershell
# Navigate to project root
cd "G:\LearningRelated\Portfolio Project\DataQuarantine"

# Start all Docker services (Rebuilds API to pick up latest fixes)
docker-compose up -d --build

# Wait 30 seconds for services to start
Start-Sleep -Seconds 30

# Check status
docker-compose ps
```

**Expected**: All services should show "Up" or "Up (healthy)"

---

## ✅ **Step 4: Run Real-Time Simulation**

To see the dashboard come alive with data:

```powershell
# Navigate to project root
cd "G:\LearningRelated\Portfolio Project\DataQuarantine"

# Install simulation library
pip install kafka-python

# Run the simulation script
python scripts/simulate_traffic.py
```

**What this does**:
- Generates 10 events per second.
- Sends 80% Valid data and 20% Invalid data (missing fields, bad types).
- Processes everything through Kafka and the DataQuarantine Engine.

---

## ✅ **Step 5: Access All UIs**

Open your browser and visit:

### 🎨 **Next.js Dashboard** (MAIN UI)
**URL**: http://localhost:3000

**What you'll see**:
- ✨ Animated stat cards with real-time scaling
- 📊 Validation rate chart (responsive)
- 🥧 Error breakdown pie chart (responsive labels)
- 📱 Mobile-friendly layout

### 🎯 **Kafka UI** (Kafka Management)
**URL**: http://localhost:8090
- Monitor `raw-events`, `validated-events`, and `quarantine-dlq` topics.

---

## 🎬 **Demo Flow (For Interviews)**

**"Let me show you how DataQuarantine handles high-velocity streams..."**

1. **Start the Simulation**: "I'm launching a producer script that mimics a real-world high-traffic app."
2. **Open Next.js Dashboard**: "Watch the metrics update live. The UI uses Glassmorphism and Framer Motion for a premium OS-like feel."
3. **Show Mobile View**: "The dashboard is fully responsive. Even the complex charts adapt to small screens."
4. **Inspect Quarantine**: "Any schema violations are captured instantly with full context."

**Impact**: 🤯 **MAXIMUM!**

---

## 🛑 **Stopping Everything**

```powershell
# Stop services
docker-compose down

# Stop UI
# Press Ctrl + C in the UI terminal
```

---

**Built with ❤️ for data quality and beautiful UIs**
