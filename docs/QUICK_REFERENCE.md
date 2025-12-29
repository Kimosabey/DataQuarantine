# 🚀 Quick Reference Card - DataQuarantine System

## 📌 Service URLs

| Service | URL | Login | Purpose |
|---------|-----|-------|---------|
| **Frontend** | http://localhost:3000 | - | User Interface |
| **API** | http://localhost:8080 | - | Backend API |
| **API Docs** | http://localhost:8080/docs | - | Swagger UI |
| **Kafka UI** | http://localhost:8090 | - | Message Queue |
| **Grafana** | http://localhost:3001 | admin/admin | Dashboards |
| **MinIO** | http://localhost:9001 | minioadmin/minioadmin | Object Storage |
| **Prometheus** | http://localhost:9090 | - | Metrics |

---

## 🗄️ Database Connection (DBeaver)

```
Host:     localhost
Port:     5432
Database: dataquarantine
Username: quarantine_user
Password: quarantine_pass
```

---

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker logs dataquarantine-api -f

# Restart a service
docker-compose restart api

# Check running containers
docker ps

# Rebuild and start
docker-compose up -d --build
```

---

## 🔍 Health Checks

### Quick Status Check:
```bash
# All containers
docker ps

# API Health
curl http://localhost:8080/health

# Prometheus Targets
# Visit: http://localhost:9090/targets
```

### Service Status:
- ✅ **Healthy**: Service is running normally
- 🟡 **Starting**: Service is initializing (wait 1-2 minutes)
- ❌ **Unhealthy**: Check logs with `docker logs <container-name>`

---

## 📊 What to Check Where

### **Kafka UI** (http://localhost:8090)
- Go to **Topics** → See message queues
- Go to **Messages** → See actual data flowing
- Go to **Consumers** → See who's reading messages

### **MinIO Console** (http://localhost:9001)
- Go to **Buckets** → See stored files
- Click on bucket → Browse files
- Go to **Metrics** → See storage usage

### **Grafana** (http://localhost:3001)
- Go to **Dashboards** → See visualizations
- Go to **Explore** → Query metrics manually
- Try query: `up{job="api"}` → See if API is up

### **DBeaver**
- Connect using info above
- Expand **dataquarantine** → **public** → **Tables**
- Right-click table → **View Data**

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| **Service won't start** | `docker-compose down && docker-compose up -d` |
| **Can't connect to DB** | Check if Postgres is running: `docker ps \| grep postgres` |
| **API errors** | View logs: `docker logs dataquarantine-api` |
| **Kafka issues** | Wait 1-2 minutes for startup, then check Kafka UI |
| **Port already in use** | Find process: `netstat -ano \| findstr :8080` |

---

## 📝 Useful SQL Queries

```sql
-- See all tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Count quarantine records
SELECT COUNT(*) FROM quarantine_records;

-- Recent records
SELECT * FROM quarantine_records ORDER BY created_at DESC LIMIT 10;

-- Records by status
SELECT status, COUNT(*) FROM quarantine_records GROUP BY status;
```

---

## 🎯 Testing the System

### 1. Check API:
```bash
curl http://localhost:8080/docs
```

### 2. Check Database:
```sql
SELECT * FROM quarantine_records LIMIT 5;
```

### 3. Check Kafka:
- Open Kafka UI → Topics → Pick a topic → Messages

### 4. Check Storage:
- Open MinIO → Buckets → Click on bucket → See files

### 5. Check Metrics:
- Open Grafana → Dashboards → Pick a dashboard

---

## 🔐 Credentials Summary

| Service | Username | Password |
|---------|----------|----------|
| Grafana | admin | admin |
| MinIO Console | minioadmin | minioadmin |
| PostgreSQL | quarantine_user | quarantine_pass |

---

## 📚 Full Documentation

See `BEGINNER_GUIDE.md` for detailed explanations and step-by-step instructions.

---

## 💡 Pro Tips

1. **Bookmark all URLs** in your browser
2. **Keep logs open** in a separate terminal: `docker-compose logs -f`
3. **Check Prometheus targets** first when troubleshooting
4. **Use DBeaver** to verify data is being stored correctly
5. **Start services in order**: Database → Kafka → API → Frontend
