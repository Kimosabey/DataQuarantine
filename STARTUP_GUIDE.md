# 🚀 DataQuarantine - Complete Startup Guide

**Follow these steps to run the ENTIRE system with the beautiful Next.js UI!**

---

## ✅ **Step 1: Install Next.js UI Dependencies**

```powershell
# Navigate to UI directory
cd "G:\LearningRelated\Portfolio Project\DataQuarantine\dataquarantine-ui"

# Install all dependencies
npm install framer-motion recharts lucide-react axios date-fns clsx tailwind-merge @tanstack/react-query

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
- Network:      http://192.168.x.x:3000

✓ Starting...
✓ Ready in 2.3s
```

**Access**: http://localhost:3000

**Keep this terminal open!**

---

## ✅ **Step 3: Start Docker Services (New Terminal)**

Open a **NEW PowerShell terminal**:

```powershell
# Navigate to project root
cd "G:\LearningRelated\Portfolio Project\DataQuarantine"

# Start all Docker services
docker-compose up -d

# Wait 30 seconds for services to start
Start-Sleep -Seconds 30

# Check status
docker-compose ps
```

**Expected**: All services should show "Up" or "Up (healthy)"

---

## ✅ **Step 4: Access All UIs**

Open your browser and visit:

### 🎨 **Next.js Dashboard** (MAIN UI)
**URL**: http://localhost:3000

**What you'll see**:
- ✨ Animated stat cards with gradients
- 📊 Validation rate chart
- 🥧 Error breakdown pie chart
- 🔴 Live system status

**Try this**:
- Click "Quarantine" in sidebar
- See smooth animations
- Hover over table rows

---

### 🎯 **Kafka UI** (Kafka Management)
**URL**: http://localhost:8090

**What to do**:
1. Go to **Topics** tab
2. Click **raw-events**
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

---

### 📊 **Grafana** (Metrics)
**URL**: http://localhost:3000
- Username: `admin`
- Password: `admin`

---

### 📦 **MinIO Console** (Storage)
**URL**: http://localhost:9001
- Username: `minioadmin`
- Password: `minioadmin`

---

## ✅ **Step 5: Send Test Messages**

### Option 1: Using Kafka UI (Easiest)
1. Go to http://localhost:8090
2. Topics → raw-events → Produce Message
3. Send valid and invalid messages
4. Watch them appear in validated-events and quarantine-dlq

### Option 2: Using Python Script

Create `send_test_messages.py`:

```python
import json
from kafka import KafkaProducer
from datetime import datetime
import random

producer = KafkaProducer(
    bootstrap_servers='localhost:9092',
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

# Send 100 messages (90% valid, 10% invalid)
for i in range(100):
    if random.random() < 0.9:
        # Valid message
        message = {
            "_schema": "user_event",
            "user_id": f"USER{i:06d}",
            "event_type": random.choice(["view", "click", "purchase"]),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "product_id": f"PROD{random.randint(1, 100)}"
        }
    else:
        # Invalid message (missing user_id)
        message = {
            "_schema": "user_event",
            "event_type": "purchase"
        }
    
    producer.send('raw-events', message)
    print(f"Sent message {i+1}/100")

producer.flush()
print("✅ Done!")
```

Run it:
```powershell
pip install kafka-python
python send_test_messages.py
```

---

## ✅ **Step 6: Watch the Magic!**

### In Next.js Dashboard (http://localhost:3000)
- Watch stat cards update (mock data for now)
- See animated charts
- Enjoy the glassmorphism effects!

### In Kafka UI (http://localhost:8090)
- See messages in raw-events
- See valid messages in validated-events
- See invalid messages in quarantine-dlq

---

## 🎬 **Demo Flow (For Interviews)**

**"Let me show you DataQuarantine in action..."**

1. **Open Next.js Dashboard**
   - "This is the modern UI I built with Next.js and Framer Motion"
   - Show animated cards
   - "Notice the glassmorphism design"

2. **Click Quarantine in Sidebar**
   - "Here's the quarantine browser"
   - Show table with filters
   - "Smooth animations on hover"

3. **Open Kafka UI**
   - "For Kafka management, I use Kafka UI"
   - Produce a message
   - Show it flowing through topics

4. **Back to Next.js Dashboard**
   - "Charts update in real-time"
   - "Error breakdown by type"

**Total Time**: 3-5 minutes  
**Impact**: 🤯 **MAXIMUM!**

---

## 🛑 **Stopping Everything**

### Stop Next.js UI
In the terminal running `npm run dev`:
- Press `Ctrl + C`

### Stop Docker Services
```powershell
cd "G:\LearningRelated\Portfolio Project\DataQuarantine"
docker-compose down
```

### Stop and Remove All Data (CAUTION!)
```powershell
docker-compose down -v
```

---

## 🐛 **Troubleshooting**

### Problem: Next.js won't start

```powershell
# Delete node_modules and reinstall
cd dataquarantine-ui
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
npm run dev
```

### Problem: Port 3000 already in use

```powershell
# Use different port
npm run dev -- -p 3001
```

Then access: http://localhost:3001

### Problem: Docker services won't start

```powershell
# Check Docker is running
docker ps

# Restart Docker Desktop
# Then try again
docker-compose up -d
```

### Problem: Kafka UI shows "Connection refused"

```powershell
# Wait for Kafka to fully start (takes ~30 seconds)
Start-Sleep -Seconds 30

# Check Kafka logs
docker-compose logs kafka
```

---

## ✅ **Success Checklist**

- [ ] Next.js UI running on http://localhost:3000
- [ ] Dashboard shows animated cards
- [ ] Quarantine page loads with table
- [ ] Kafka UI accessible on http://localhost:8090
- [ ] Can produce messages to raw-events
- [ ] Messages appear in topics
- [ ] Grafana accessible on http://localhost:3000
- [ ] MinIO accessible on http://localhost:9001

---

## 🎉 **You're Ready!**

**Next.js Dashboard**: http://localhost:3000  
**Kafka UI**: http://localhost:8090  
**Grafana**: http://localhost:3000  
**MinIO**: http://localhost:9001

**Enjoy your beautiful, production-grade data platform!** ✨

---

## 📸 **Take Screenshots!**

1. Next.js Dashboard with animated cards
2. Quarantine browser with table
3. Kafka UI with topics
4. All UIs side-by-side

**Use these for**:
- GitHub README
- Resume
- LinkedIn posts
- Interview presentations

---

**Built with ❤️ for data quality and beautiful UIs**
