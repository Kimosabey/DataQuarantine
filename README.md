# DataQuarantine - Streaming Schema Enforcer

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.9+-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

## 🎯 Overview

**DataQuarantine** is a production-ready streaming schema enforcement system that validates, quarantines, and monitors data quality in real-time streaming pipelines. It acts as a data quality gateway, ensuring only valid data flows through your pipeline while capturing and managing invalid records for review and reprocessing.

### Business Problem

In production streaming pipelines:
- **Bad data corrupts downstream systems** (analytics, ML models, dashboards)
- **Schema violations go undetected** until they cause failures
- **No centralized data quality governance**
- **Debugging invalid data is time-consuming**

### The Solution

A **real-time validation gateway** that:
1. Validates every message against a schema
2. Routes valid messages to clean topics
3. Quarantines invalid messages to DLQ 
4. Provides metrics and alerting
5. Enables reprocessing after fixes

---

## 🚀 Quick Start (3 Steps)

### Step 1: Start All Services
```bash
cd d:\01_Projects\Personal\POCs\DataQuarantine
docker-compose up -d
```

### Step 2: Verify Everything is Running
```bash
docker ps
```
You should see 8 containers running.

### Step 3: Access Your Services
| Service        | URL                        | Credentials             |
| -------------- | -------------------------- | ----------------------- |
| **Frontend**   | http://localhost:3000      | None                    |
| **API Docs**   | http://localhost:8800/docs | None                    |
| **Kafka UI**   | http://localhost:8090      | None                    |
| **Grafana**    | http://localhost:3001      | admin / admin           |
| **MinIO**      | http://localhost:9001      | minioadmin / minioadmin |
| **Prometheus** | http://localhost:9090      | None                    |

**DBeaver Connection (PostgreSQL)**:
- Host: `localhost`
- Port: `5432`
- Database: `dataquarantine`
- Username: `quarantine_user`
- Password: `quarantine_pass`

---

## 🏗️ System Architecture

### High-Level Architecture Diagram

```mermaid
graph TB
    classDef source fill:#e63946,stroke:#d62828,stroke-width:3px,color:#fff,font-weight:bold
    classDef kafka fill:#ffd60a,stroke:#fca311,stroke-width:3px,color:#000,font-weight:bold
    classDef engine fill:#0077b6,stroke:#023e8a,stroke-width:3px,color:#fff,font-weight:bold
    classDef storage fill:#06a77d,stroke:#048a5f,stroke-width:3px,color:#fff,font-weight:bold
    classDef ui fill:#9d4edd,stroke:#7b2cbf,stroke-width:3px,color:#fff,font-weight:bold
    classDef metrics fill:#fb6f92,stroke:#ff006e,stroke-width:3px,color:#fff,font-weight:bold

    subgraph Sources [📱 Data Sources]
        A["Mobile Apps"]:::source
        B["Web APIs"]:::source
        C["IoT Devices"]:::source
    end

    subgraph Streaming [🔄 Message Queue - Kafka]
        D(("raw-events<br/>Topic")):::kafka
        E(("validated-events<br/>Topic")):::kafka
        F(("quarantine-dlq<br/>Topic")):::kafka
    end

    subgraph Engine [⚙️ DataQuarantine Validator Engine]
        G["Validator Engine"]:::engine
        H["Schema Registry"]:::engine
    end

    subgraph Storage [💾 Storage Layer]
        I[("PostgreSQL<br/>Metadata")]:::storage
        J[("MinIO<br/>Quarantine Files")]:::storage
    end

    subgraph Frontend [🖥️ User Interface]
        K["Next.js Dashboard"]:::ui
        L["Quarantine Review"]:::ui
        M["Live Monitor"]:::ui
    end

    subgraph Monitoring [📊 Monitoring Stack]
        N["Prometheus"]:::metrics
        O["Grafana"]:::metrics
    end

    A -->|publish| D
    B -->|publish| D
    C -->|publish| D

    D -->|consume| G
    G <-->|fetch schemas| H
    G -->|✅ valid| E
    G -->|❌ invalid| F

    F -->|store files| J
    F -->|log metadata| I

    E -->|metrics| N
    G -->|metrics| N
    N -->|query| O

    I -->|query data| K
    J -->|retrieve files| L
    E -->|stream data| M
    O -.->|visualize| K
```

### Data Flow - Step by Step

```mermaid
%%{ init: { 'theme': 'base', 'themeVariables': { 'primaryColor': '#0077b6', 'primaryTextColor': '#fff', 'primaryBorderColor': '#023e8a', 'lineColor': '#48cae4', 'secondaryColor': '#06a77d', 'tertiaryColor': '#ffd60a', 'noteTextColor': '#000', 'noteBkgColor': '#ffd60a' }}}%%
sequenceDiagram
    participant P as 📱 Producer
    participant K1 as Kafka: raw-events
    participant V as ⚙️ Validator Engine
    participant S as 📋 Schema Registry
    participant K2 as Kafka: valid-events
    participant D as Kafka: quarantine-dlq
    participant DB as 💾 PostgreSQL
    participant M as 📦 MinIO

    P->>K1: Publish Message
    K1->>V: Poll & Consume
    V->>S: Get Schema
    S-->>V: Return Schema Definition
    
    alt Message is Valid
        V->>K2: Publish to valid-events
        V->>K1: Commit Offset
        Note over V,K2: ✅ Happy Path - No Data Loss
    else Message is Invalid  
        V->>D: Publish to DLQ
        V->>M: Store Full Record
        V->>DB: Log Metadata
        V->>K1: Commit Offset
        Note over V,M: ❌ Quarantined for Review
    end
```

### Component Responsibilities

```mermaid
graph LR
    classDef component fill:#0077b6,stroke:#023e8a,stroke-width:3px,color:#fff,font-weight:bold
    classDef responsibility fill:#ffd60a,stroke:#fca311,stroke-width:2px,color:#000,font-weight:bold

    subgraph Frontend ["🖥️ Frontend - Port 3000"]
        F1["User Interface"]:::component
        F2["Forms & Tables"]:::responsibility
        F3["API Calls"]:::responsibility
        F4["Real-time Updates"]:::responsibility
    end

    subgraph API ["🔌 API - Port 8800"]
        A1["Business Logic"]:::component
        A2["Data Validation"]:::responsibility
        A3["Kafka Publishing"]:::responsibility
        A4["DB Operations"]:::responsibility
    end

    subgraph Kafka ["📨 Kafka - Port 9092"]
        K1["Message Queue"]:::component
        K2["Event Streaming"]:::responsibility
        K3["Topic Management"]:::responsibility
    end

    subgraph Database ["🗄️ PostgreSQL - Port 5432"]
        D1["Metadata Store"]:::component
        D2["Quarantine Records"]:::responsibility
        D3["Validation Rules"]:::responsibility
    end

    subgraph Storage ["📦 MinIO - Ports 9000/9001"]
        M1["Object Storage"]:::component
        M2["File Storage"]:::responsibility
        M3["S3-Compatible API"]:::responsibility
    end

    subgraph Monitor ["📊 Monitoring"]
        P1["Prometheus - 9090"]:::component
        G1["Grafana - 3001"]:::component
        P2["Metrics Collection"]:::responsibility
        G2["Visualization"]:::responsibility
    end

    F1 --> A1
    A1 --> K1
    K1 --> D1
    K1 --> M1
    A1 --> D1
    P1 --> G1
```

---

## 🎯 Key Features

### Core Capabilities
- ✅ **Real-time Schema Validation**: Validate streaming data against JSON Schema, Avro, or custom schemas
- ✅ **Intelligent Quarantine**: Automatically isolate invalid records with detailed error context
- ✅ **Multi-Source Support**: Works with Kafka, AWS Kinesis, Google Pub/Sub
- ✅ **Flexible Schema Management**: Version-controlled schemas with backward compatibility
- ✅ **Data Quality Metrics**: Real-time monitoring of validation rates and error types

### Advanced Features
- 🔧 **Auto-Remediation**: Configurable rules to fix common data issues
- 🌐 **Modern UI**: Next.js dashboard with glassmorphism design & animations
- 🔔 **Alert System**: Configurable alerts for quality degradation
- 📜 **Audit Trail**: Complete lineage tracking for compliance
- ⚡ **High Performance**: Handles high-throughput with minimal latency

---

## 🛠️ Technology Stack

| Layer              | Technology              | Purpose                            |
| ------------------ | ----------------------- | ---------------------------------- |
| **Streaming**      | Kafka/Redpanda          | Message queue, event streaming     |
| **Validation**     | Pydantic + jsonschema   | Type-safe, fast validation         |
| **Metadata DB**    | PostgreSQL              | ACID compliance, rich querying     |
| **Object Storage** | MinIO                   | S3-compatible, self-hosted storage |
| **Metrics**        | Prometheus              | Pull-based metrics collection      |
| **Visualization**  | Grafana                 | Dashboard and alerting             |
| **API**            | FastAPI                 | Async, auto-docs, high performance |
| **Frontend**       | Next.js 14 + TypeScript | Modern, responsive UI              |
| **Language**       | Python 3.11+            | Async support, rich ecosystem      |
| **Deployment**     | Docker Compose / K8s    | Container orchestration            |

---

## 📊 Complete End-to-End Flow

### Valid Message Flow (Happy Path)

```mermaid
%%{ init: { 'theme': 'base', 'themeVariables': { 'primaryColor': '#06a77d', 'primaryTextColor': '#fff', 'primaryBorderColor': '#048a5f', 'lineColor': '#0077b6', 'secondaryColor': '#0077b6', 'tertiaryColor': '#ffd60a' }}}%%
stateDiagram-v2
    [*] --> Published: Producer Sends
    Published --> Consumed: Kafka Poll
    Consumed --> SchemaLoad: Fetch Schema
    SchemaLoad --> Validating: Run Validators
    Validating --> Valid: ✅ Passed
    Valid --> Routed: Publish to valid-events
    Routed --> Committed: Commit Offset
    Committed --> [*]

    note right of Valid: Message is Clean
    note right of Committed: Zero Data Loss
```

### Invalid Message Flow (Quarantine Path)

```mermaid
%%{ init: { 'theme': 'base', 'themeVariables': { 'primaryColor': '#e63946', 'primaryTextColor': '#fff', 'primaryBorderColor': '#d62828', 'lineColor': '#0077b6', 'secondaryColor': '#0077b6', 'tertiaryColor': '#ffd60a' }}}%%
stateDiagram-v2
    [*] --> Published: Producer Sends
    Published --> Consumed: Kafka Poll
    Consumed --> SchemaLoad: Fetch Schema
    SchemaLoad --> Validating: Run Validators
    Validating --> Invalid: ❌ Failed
    Invalid --> Quarantined: Publish to DLQ
    Quarantined --> StoredMinIO: Store in MinIO
    StoredMinIO --> LoggedDB: Log Metadata
    LoggedDB --> Committed: Commit Offset
    Committed --> ReviewUI: Available for Review
    ReviewUI --> [*]

    note right of Invalid: Schema Violation
    note right of ReviewUI: Can Reprocess
```

---

## 📦 Installation & Setup

### Prerequisites
- Docker & Docker Compose
- Python 3.11+ (for local development)
- Git

### Installation Steps

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/dataquarantine.git
cd dataquarantine

# 2. Start all services with Docker Compose
docker-compose up -d

# 3. Wait for services to initialize (~30 seconds)
docker-compose logs -f

# 4. Verify all containers are running
docker ps

# 5. Access the frontend
# Open browser: http://localhost:3000
```

### Database Initialization

The database is automatically initialized with the required schema on first startup via init scripts in `/api/scripts/init_db.sql`.

---

## 🧪 Testing Checklist

### Infrastructure Layer
- [ ] **Docker Containers**: All 8 containers running (`docker ps`)
- [ ] **No Restarts**: Status column shows "Up", not "Restarting"
- [ ] **Network**: All containers on same network

### Database Layer
- [ ] **PostgreSQL Running**: Check `docker logs dataquarantine-postgres`
- [ ] **Tables Created**: Verify in DBeaver
- [ ] **Sample Data**: Check row counts in key tables

### Message Queue Layer
- [ ] **Kafka Online**: Check Kafka UI → Brokers tab
- [ ] **Topics Created**: Verify `raw-events`, `validated-events`, `quarantine-dlq` exist
- [ ] **Messages Flowing**: Monitor message counts

### Storage Layer
- [ ] **MinIO Accessible**: Login to http://localhost:9001
- [ ] **Buckets Created**: Check for `quarantine`, `validated-data` buckets
- [ ] **Files Stored**: Browse bucket contents

### API Layer
- [ ] **API Responds**: Visit http://localhost:8800/docs
- [ ] **No Errors**: Check `docker logs dataquarantine-api`
- [ ] **Endpoints Work**: Test a GET request

### Frontend Layer
- [ ] **UI Loads**: Visit http://localhost:3000
- [ ] **No Console Errors**: Check browser console (F12)
- [ ] **Interactive**: Test buttons and forms

### Monitoring Layer
- [ ] **Prometheus Scraping**: Check http://localhost:9090/targets (all UP)
- [ ] **Grafana Connected**: Verify data source in Grafana

---

## 🔍 Monitoring & Observability

### Prometheus Metrics

```promql
# Total records processed
dataquarantine_records_processed_total{topic="raw-events", schema="user_event"}

# Validation success rate
rate(dataquarantine_records_valid_total[5m]) / 
rate(dataquarantine_records_processed_total[5m])

# Quarantine rate by error type
sum by (error_type) (dataquarantine_records_invalid_total)

# p99 validation latency
histogram_quantile(0.99, dataquarantine_validation_duration_seconds)

# Kafka consumer lag
dataquarantine_kafka_lag{topic="raw-events", partition="0"}
```

### Grafana Dashboards

Access Grafana at `http://localhost:3001` with default credentials (`admin/admin`).

**Key Panels:**
- 📈 API Request Rate (requests/min)
- ✅ Validation Success Rate (%)
- ❌ Quarantine Rate by Error Type
- ⏱️ p50/p95/p99 Latency
- 🔌 Database Connection Pool Status
- 📊 Kafka Consumer Lag

---

## 📖 Use Cases

### 1. **IoT Data Validation**
**Scenario**: Smart home devices sending temperature readings
- **Challenge**: Devices occasionally send corrupted data
- **Solution**: Validate against schema, quarantine invalid readings
- **Benefit**: Analytics dashboards show only reliable data

### 2. **E-Commerce Event Streams**
**Scenario**: User clickstream data from web/mobile apps
- **Challenge**: Schema changes break downstream ML pipelines
- **Solution**: Enforce schema contracts, auto-remediate minor issues
- **Benefit**: ML models train on clean, consistent data

### 3. **Financial Transaction Processing**
**Scenario**: Real-time payment events
- **Challenge**: Regulatory compliance requires audit trail
- **Solution**: Validate, log all decisions, store quarantined records
- **Benefit**: Full auditability for compliance teams

### 4. **Multi-Tenant SaaS Platform**
**Scenario**: Different customers submitting varied data formats
- **Challenge**: Each tenant has custom schemas
- **Solution**: Schema registry with versioning per tenant
- **Benefit**: Isolated validation, no cross-contamination

---

## 🚨 Failure Scenarios & Resilience

### Kafka Broker Failure
- **Mitigation**: Manual offset commit (after successful processing)
- **Result**: **Zero data loss** (messages reprocessed on restart)

### PostgreSQL Failure
- **Strategy**: Fail-open with degraded mode
- **Action**: Buffer metadata in-memory, fallback to local files
- **Result**: Pipeline continues, metadata delayed

### MinIO Failure
- **Strategy**: Local fallback storage
- **Action**: Write to local disk, background sync later
- **Result**: No data loss, temporary local storage

### Schema Registry Failure
- **Strategy**: Fail-closed with cache
- **Action**: Use cached schema if available, else reject all messages
- **Result**: Prevents processing with unknown schema

### High Error Rate
- **Strategy**: Circuit breaker pattern
- **Action**: Alert if error rate > 50% for 5 minutes, pause processing
- **Result**: Manual intervention required

---

## 🎨 Frontend Dashboard

Access the modern Next.js dashboard at `http://localhost:3000`:

### Features
- ✨ **Modern UI**: Glassmorphism design with Framer Motion animations
- 📊 **Real-Time Charts**: Interactive metrics with Recharts
- 🌙 **Dark Mode**: Optimized dark theme
- 📱 **Responsive**: Mobile-friendly design
- ⚡ **Live Updates**: WebSocket-based real-time data

### Pages
1. **Dashboard**: System overview with key metrics
2. **Records Browser**: Search/filter quarantined records
3. **Live Monitor**: Real-time message stream
4. **Schema Viewer**: Browse and validate schemas
5. **System Status**: Service health monitoring

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```env
# Kafka
KAFKA_BOOTSTRAP_SERVERS=kafka:29092
KAFKA_CONSUMER_GROUP_ID=dataquarantine-validators
KAFKA_RAW_TOPIC=raw-events
KAFKA_VALID_TOPIC=validated-events
KAFKA_DLQ_TOPIC=quarantine-dlq

# PostgreSQL
DATABASE_URL=postgresql://quarantine_user:quarantine_pass@postgres:5432/dataquarantine
DB_POOL_SIZE=20

# MinIO
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=data-quarantine
MINIO_SECURE=false

# API
API_HOST=0.0.0.0
API_PORT=8800

# Monitoring
PROMETHEUS_PORT=9090
```

### Schema Definition Example

```yaml
# schemas/user_event.yaml
version: "1.0.0"
name: "user_event"
type: "json_schema"
schema:
  type: object
  properties:
    user_id:
      type: string
      pattern: "^USER[0-9]{6}$"
    event_type:
      type: string
      enum: ["view", "click", "purchase"]
    timestamp:
      type: string
      format: date-time
  required:
    - user_id
    - event_type
    - timestamp

# Custom validation rules
rules:
  - name: "future_timestamp_check"
    type: "custom"
    expression: "timestamp <= now()"
    error_message: "Timestamp cannot be in the future"
```

---

## 🐛 Troubleshooting

### Service Won't Start
```bash
# Check logs for specific service
docker logs dataquarantine-api

# Restart specific service
docker-compose restart api

# Rebuild if code changed
docker-compose up -d --build
```

### Kafka Connection Issues
```bash
# Kafka takes ~30 seconds to initialize
# Check Kafka is ready
docker logs dataquarantine-kafka | grep "started"

# Verify Zookeeper is running
docker logs dataquarantine-zookeeper
```

### Database Connection Errors
```bash
# Check PostgreSQL logs
docker logs dataquarantine-postgres

# Test connection from DBeaver
# Verify credentials in docker-compose.yml match .env
```

### No Data in Grafana
```bash
# Check Prometheus targets
# Visit: http://localhost:9090/targets
# All should be "UP" (green)

# Verify time range in Grafana (top-right)
# Try "Last 1 hour" or "Last 6 hours"
```

---

## 📚 Documentation Structure

| Document                | Purpose                                              |
| ----------------------- | ---------------------------------------------------- |
| `README.md`             | **You are here** - Complete overview and quick start |
| `QUICKSTART.md`         | Detailed setup guide with troubleshooting            |
| `ARCHITECTURE_GUIDE.md` | Deep dive into system architecture                   |
| `HLD.md`                | High-level design document                           |
| `LLD.md`                | Low-level design with code samples                   |
| `FLOW.md`               | Complete data flow walkthrough                       |
| `TESTING_CHECKLIST.md`  | Comprehensive testing guide                          |
| `USE_CASES.md`          | Real-world use cases and examples                    |

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Inspired by data quality challenges in production streaming pipelines
- Built with best practices from the data engineering community
- Implements industry-standard patterns (DLQ, Circuit Breaker, Event Sourcing)

---

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/yourusername/dataquarantine/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/dataquarantine/discussions)
- **Email**: your.email@example.com

---

**Built with ❤️ for Data Quality and Stream Processing**

**Document Version**: 2.0  
**Last Updated**: December 2025  
**Status**: ✅ Active Development
