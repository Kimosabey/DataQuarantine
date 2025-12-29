# 🏗️ DataQuarantine System Architecture

## 📊 Complete System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER LAYER                                      │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐   │
│  │   Browser    │────────▶│  Frontend    │────────▶│   DBeaver    │   │
│  │ (Your Device)│         │  (Next.js)   │         │  (Database   │   │
│  │              │         │ Port: 3000   │         │   Client)    │   │
│  └──────────────┘         └──────┬───────┘         └──────────────┘   │
└─────────────────────────────────┼────────────────────────────────────────┘
                                  │
                                  │ HTTP Requests (POST/GET)
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        API LAYER                                        │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  FastAPI Backend (Python)          Port: 8080                  │    │
│  │  • REST API Endpoints                                          │    │
│  │  • Data Validation Logic                                       │    │
│  │  • Quarantine Processing                                       │    │
│  │  • Swagger UI Documentation at /docs                           │    │
│  └─────┬──────────┬──────────┬────────────────────────────────────┘    │
└────────┼──────────┼──────────┼─────────────────────────────────────────┘
         │          │          │
         │          │          │
    ┌────▼────┐ ┌───▼────┐ ┌──▼─────┐
    │ Publish │ │ Store  │ │ Insert │
    │ Events  │ │ Files  │ │ Records│
    │         │ │        │ │        │
    ▼         ▼ ▼        ▼ ▼        ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│  Kafka   │ │  MinIO   │ │ Postgres │
│ (Queue)  │ │ (Storage)│ │   (DB)   │
└────┬─────┘ └──────────┘ └──────────┘
     │
     │ Consume Events
     ▼
┌──────────────────────────────────────┐
│  Background Workers/Consumers        │
│  • Process quarantined data          │
│  • Validate against rules            │
│  • Update records                    │
└──────────────────────────────────────┘
```

---

## 🔄 Data Flow - Step by Step

### Scenario: User Submits Data for Validation

```
1. USER INTERFACE (Port 3000)
   │
   │ User uploads CSV file via web form
   │
   ▼
2. FRONTEND (Next.js)
   │
   │ • Validates file format
   │ • Shows loading spinner
   │ • Sends to API via HTTP POST
   │
   ▼
3. API BACKEND (Port 8080)
   │
   ├──▶ Receives file
   ├──▶ Validates schema
   ├──▶ Checks business rules
   │
   ├── [If data looks suspicious] ─────────┐
   │                                        │
   ▼                                        ▼
4a. KAFKA (Port 9092)              4b. POSTGRES (Port 5432)
    │                                   │
    ├─▶ Publishes event:                ├─▶ Inserts record:
    │   "quarantine-event"               │   • ID, filename
    │   {                                │   • status: "quarantined"
    │     id: "123",                     │   • reason
    │     reason: "Invalid email"        │   • timestamp
    │   }                                │
    ▼                                    ▼
5. MINIO (Ports 9000-9001)         [Record stored for tracking]
   │
   ├─▶ Stores file:
   │   Bucket: "quarantine"
   │   Path: "2025/12/29/file_123.csv"
   │
   ▼
6. KAFKA CONSUMER (Background Worker)
   │
   ├─▶ Reads "quarantine-event"
   ├─▶ Retrieves file from MinIO
   ├─▶ Applies advanced validation
   │
   ├── [If validation passes] ──────────┐
   │                                    │
   ▼                                    ▼
7. UPDATE DATABASE               7. MOVE FILE IN MINIO
   │                                    │
   ├─▶ UPDATE quarantine_records        ├─▶ From: "quarantine/"
   │   SET status = 'validated'         │   To: "validated-data/"
   │   WHERE id = 123                   │
   ▼                                    ▼
8. PROMETHEUS METRICS (Port 9090)
   │
   ├─▶ Records:
   │   • validation_success_total++
   │   • processing_duration_seconds
   │   • quarantine_records_total
   │
   ▼
9. GRAFANA DASHBOARD (Port 3001)
   │
   ├─▶ Queries Prometheus
   ├─▶ Displays graphs:
   │   • Validations per minute
   │   • Success vs. Failure rate
   │   • Processing time trends
   │
   ▼
10. USER SEES RESULT
    │
    └─▶ Frontend polls API
        API returns: {status: "validated"}
        UI shows: ✅ "Data validated successfully!"
```

---

## 🔍 Tool Responsibilities

### Frontend (Port 3000)
**Role**: User Interface
- Displays forms, tables, dashboards
- Handles user input
- Calls API endpoints
- Shows real-time updates

**You Check Here**:
- UI loads correctly
- Forms submit data
- Error messages display

---

### API (Port 8080)
**Role**: Business Logic Brain
- Validates incoming data
- Applies quarantine rules
- Sends data to Kafka
- Stores records in database
- Saves files to MinIO

**You Check Here**:
- `/docs` shows all endpoints
- Endpoints return proper responses
- Logs show no errors

---

### Kafka (Port 9092) + Kafka UI (Port 8090)
**Role**: Message Queue System
- **What it does**: Like a post office for your application
- **Producers**: API sends messages (events) here
- **Consumers**: Background workers read messages
- **Topics**: Different "mailboxes" for different types of events

**You Check Here (Kafka UI)**:
- Topics exist
- Messages are being published
- Consumers are reading messages
- No lag (messages processed quickly)

**Example Flow**:
```
API → Publishes to "quarantine-events" topic
      ↓
Kafka stores message
      ↓
Consumer reads from "quarantine-events" topic
      ↓
Consumer processes and updates database
```

---

### PostgreSQL (Port 5432) + DBeaver
**Role**: Relational Database
- Stores structured data in tables
- Tracks quarantine records, validation rules, audit logs
- Provides ACID guarantees (data integrity)

**You Check Here (DBeaver)**:
- Tables exist with correct schema
- Records are being inserted
- Queries return expected data
- Relationships between tables are correct

**Sample Tables**:
```
quarantine_records
├─ id (Primary Key)
├─ filename
├─ status (quarantined, validated, rejected)
├─ reason
├─ minio_path
├─ created_at
└─ updated_at

validation_rules
├─ id
├─ rule_name
├─ rule_type
├─ configuration (JSON)
└─ is_active
```

---

### MinIO (Ports 9000-9001)
**Role**: Object Storage (like AWS S3)
- Stores actual files (CSVs, JSONs, images, etc.)
- Organized in "buckets" (like top-level folders)
- Provides S3-compatible API

**You Check Here (MinIO Console)**:
- Buckets created (quarantine, validated-data, etc.)
- Files are being stored
- File sizes and counts make sense
- Can download and preview files

**Bucket Structure**:
```
quarantine/
├─ 2025/
│  └─ 12/
│     └─ 29/
│        ├─ suspicious_file_001.csv
│        └─ invalid_data_002.json
│
validated-data/
└─ 2025/
   └─ 12/
      └─ 29/
         └─ clean_file_003.csv
```

---

### Prometheus (Port 9090)
**Role**: Metrics Collector
- Constantly "scrapes" (asks) all services for metrics
- Stores time-series data (values over time)
- Provides query language (PromQL)

**You Check Here**:
- `/targets` shows all services are UP
- Can query basic metrics like `up`
- Metrics are being collected (values change over time)

**Sample Metrics**:
```
# Is service running?
up{job="api"} = 1

# Total HTTP requests
http_requests_total{endpoint="/quarantine"} = 1523

# Request duration (milliseconds)
http_request_duration_seconds{quantile="0.99"} = 0.145
```

---

### Grafana (Port 3001)
**Role**: Metrics Visualization
- Queries Prometheus for data
- Displays beautiful graphs and dashboards
- Supports alerts (optional)

**You Check Here**:
- Data source (Prometheus) is connected
- Dashboards load with data
- Graphs update in real-time
- Time range is set correctly

**Example Dashboard Panels**:
```
┌────────────────────────────────────┐
│  API Request Rate (req/min)       │
│  ████████▁▁▁████████▁▁▁▁▁▁        │
│  Current: 45 req/min               │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│  Quarantine Success Rate           │
│  ✅ 98.5% success                  │
│  ❌ 1.5% failure                   │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│  Database Connections              │
│  Active: 7/20                      │
│  Idle: 13                          │
└────────────────────────────────────┘
```

---

## 🌐 How Components Communicate

### API ↔ PostgreSQL
- **Protocol**: TCP (SQL queries)
- **Library**: SQLAlchemy (Python ORM)
- **Connection String**: `postgresql://user:pass@postgres:5432/dataquarantine`

### API ↔ Kafka
- **Protocol**: Kafka Protocol (binary)
- **Library**: aiokafka (Python async client)
- **Connection**: `kafka:29092` (internal Docker network)

### API ↔ MinIO
- **Protocol**: HTTP (S3 API)
- **Library**: minio-py (Python client)
- **Connection**: `minio:9000`

### Grafana ↔ Prometheus
- **Protocol**: HTTP (REST API)
- **Query Language**: PromQL
- **Connection**: `http://prometheus:9090`

### Frontend ↔ API
- **Protocol**: HTTP/HTTPS
- **Format**: JSON
- **Connection**: `http://localhost:8080`

---

## 🐳 Docker Network Architecture

All containers run in the same Docker network: `dataquarantine-network`

```
┌──────────────────────────────────────────────────────────────┐
│  dataquarantine-network (Bridge Network)                     │
│  IP Range: 172.18.0.0/16 (example)                          │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Frontend    │  │     API      │  │   Postgres   │      │
│  │  (not in     │  │  172.18.0.5  │  │  172.18.0.2  │      │
│  │  network)    │  └──────────────┘  └──────────────┘      │
│  └──────────────┘        │ │ │                              │
│                          │ │ └──────────┐                   │
│  ┌──────────────┐        │ │            │                   │
│  │    Kafka     │◀───────┘ │            │                   │
│  │  172.18.0.3  │          │            │                   │
│  └──────────────┘          │            │                   │
│         ▲                  │            │                   │
│         │                  │            │                   │
│  ┌──────┴───────┐          │            │                   │
│  │  Zookeeper   │          │            │                   │
│  │  172.18.0.4  │          │            │                   │
│  └──────────────┘          │            │                   │
│                            │            │                   │
│  ┌──────────────┐          │            │                   │
│  │    MinIO     │◀─────────┘            │                   │
│  │  172.18.0.6  │                       │                   │
│  └──────────────┘                       │                   │
│                                         │                   │
│  ┌──────────────┐  ┌──────────────┐    │                   │
│  │  Prometheus  │  │   Grafana    │◀───┘                   │
│  │  172.18.0.7  │  │  172.18.0.8  │                        │
│  └──────────────┘  └──────────────┘                        │
│         ▲                  │                                │
│         └──────────────────┘                                │
└──────────────────────────────────────────────────────────────┘
         │                                   │
         │ Port Mappings to Host             │
         ▼                                   ▼
    localhost:9090                     localhost:3001
    localhost:8080                     localhost:9001
    localhost:9092                     localhost:8090
    localhost:5432                     localhost:3000
```

**Why Docker Network?**
- Containers can talk to each other by name (e.g., `kafka:29092`)
- Internal communication bypasses localhost
- Only specified ports are exposed to your host machine

---

## 📂 Data Storage Locations

### In Docker Volumes (Persistent):
```
Windows Host: C:\ProgramData\Docker\volumes\

dataquarantine_postgres-data\   ← PostgreSQL database files
dataquarantine_kafka-data\      ← Kafka message logs
dataquarantine_minio-data\      ← MinIO object storage
dataquarantine_grafana-data\    ← Grafana dashboards & config
dataquarantine_prometheus-data\ ← Prometheus time-series data
dataquarantine_zookeeper-data\  ← Zookeeper metadata
```

**Important**: Even if you stop containers, this data persists!

---

## 🔐 Security & Credentials

| Service | Authentication | Default Credentials |
|---------|---------------|---------------------|
| Frontend | None (local dev) | N/A |
| API | None (local dev) | N/A |
| Kafka | None (local dev) | N/A |
| PostgreSQL | Password | quarantine_user / quarantine_pass |
| MinIO | Access Keys | minioadmin / minioadmin |
| Grafana | Username/Password | admin / admin |
| Prometheus | None | N/A |

**⚠️ Production Note**: These are development credentials. In production, use:
- Strong passwords
- TLS/SSL encryption
- Network policies
- Secret management (e.g., Vault)

---

## 🎯 How to Use This Architecture

### For Debugging:
1. **Trace the flow**: Follow data from Frontend → API → Kafka → DB
2. **Check each step**: Use the tools (Kafka UI, DBeaver, etc.) to verify data at each stage
3. **Check logs**: `docker logs <container-name>` for errors

### For Understanding:
1. **Start with the user**: What does the user want to do?
2. **Follow the data**: Where does it go? (API → Kafka → DB → MinIO)
3. **See the result**: How is it displayed? (Grafana, Frontend)

### For Monitoring:
1. **Prometheus**: Is collecting metrics from all services
2. **Grafana**: Is visualizing those metrics
3. **You**: Can see system health at a glance

---

## 📖 Glossary

| Term | Meaning |
|------|---------|
| **Broker** | Kafka server that stores and serves messages |
| **Topic** | Category/channel for messages in Kafka |
| **Producer** | Application that sends messages to Kafka (e.g., your API) |
| **Consumer** | Application that reads messages from Kafka |
| **Bucket** | Top-level folder in MinIO (like S3 bucket) |
| **Object** | File stored in MinIO |
| **Metric** | Numerical measurement over time (e.g., request count) |
| **Scrape** | Prometheus collecting metrics from a service |
| **Target** | Service that Prometheus is monitoring |
| **Panel** | Single graph/chart in a Grafana dashboard |
| **Data Source** | Where Grafana gets its data (e.g., Prometheus) |
| **Schema** | Structure/blueprint of database tables |
| **ORM** | Object-Relational Mapping (SQLAlchemy) - Python ↔ SQL |

---

## 🎓 Learning Path

### Week 1: Basics
- [ ] Understand what each component does
- [ ] Access each UI and explore
- [ ] Run simple queries in DBeaver
- [ ] View messages in Kafka UI

### Week 2: Integration
- [ ] Trace a single request through the system
- [ ] Submit test data and watch it flow
- [ ] Check logs at each stage
- [ ] Verify data in DB and storage

### Week 3: Monitoring
- [ ] Understand Prometheus metrics
- [ ] Create a simple Grafana dashboard
- [ ] Set up alerts (optional)
- [ ] Monitor system under load

### Week 4: Deep Dive
- [ ] Modify API code and test
- [ ] Create custom Kafka topics
- [ ] Write advanced SQL queries
- [ ] Optimize performance

---

**Remember**: This is a **proof of concept (POC)** system. It's designed for learning and testing, not production use. Feel free to experiment!

---

**Last Updated**: 2025-12-29
**Document Version**: 1.0
