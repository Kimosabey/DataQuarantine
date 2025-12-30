# ⚡ DataQuarantine - 3-Minute Startup

Ultra-quick reference for starting the system.

---

## 🚀 Start Everything

```bash
cd d:\01_Projects\Personal\POCs\DataQuarantine
docker-compose up -d
```

---

## ✅ Verify (30 seconds)

```bash
# Check all 8 containers are running
docker ps

# Should see: api, frontend, postgres, kafka, zookeeper, minio, prometheus, grafana
```

---

## 🌐 Access Services

| Service | URL | Login |
|---------|-----|-------|
| **Frontend** | http://localhost:3000 | None |
| **API Docs** | http://localhost:8800/docs | None |
| **Kafka UI** | http://localhost:8090 | None |
| **Grafana** | http://localhost:3001 | admin / admin |
| **MinIO** | http://localhost:9001 | minioadmin / minioadmin |
| **Prometheus** | http://localhost:9090 | None |

---

## 🛑 Stop Everything

```bash
docker-compose down
```

---

## 🔄 Restart a Service

```bash
# Restart specific service
docker-compose restart api

# View logs
docker logs -f dataquarantine-api
```

---

## 🐛 Troubleshooting One-Liners

```bash
# Check all logs
docker-compose logs

# Check specific service logs
docker logs dataquarantine-api

# Rebuild and restart
docker-compose up -d --build

# Complete reset (⚠️ deletes all data)
docker-compose down -v
docker-compose up -d
```

---

## 📖 Need More Help?

- **Detailed Guide**: [QUICKSTART.md](./QUICKSTART.md)
- **Architecture**: [ARCHITECTURE_GUIDE.md](./ARCHITECTURE_GUIDE.md)
- **Full README**: [../README.md](../README.md)

---

**⏱️ Total Time: 3 minutes**
