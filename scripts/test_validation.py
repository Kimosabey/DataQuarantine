#!/usr/bin/env python3
"""
DataQuarantine - Complete System Simulation
Demonstrates all message types and flows
"""

import json
import time
from kafka import KafkaProducer
from datetime import datetime

# Kafka Configuration
KAFKA_BOOTSTRAP = 'localhost:9092'
RAW_TOPIC = 'raw-events'

# Initialize Producer
print("🚀 Initializing Kafka Producer...")
producer = KafkaProducer(
    bootstrap_servers=KAFKA_BOOTSTRAP,
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)
print("✅ Producer ready!\n")

# Test Messages
test_messages = [
    # ✅ VALID MESSAGE #1 - Perfect user event
    {
        "name": "Valid User Event",
        "type": "VALID",
        "message": {
            "_schema": "user_event",
            "user_id": "USER123456",
            "event_type": "purchase",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "product_id": "PROD789",
            "session_id": "sess_abc123"
        }
    },
    
    # ✅ VALID MESSAGE #2 - Another valid event
    {
        "name": "Valid Click Event",
        "type": "VALID",
        "message": {
            "_schema": "user_event",
            "user_id": "USER654321",
            "event_type": "click",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "product_id": "PROD456",
            "session_id": "sess_xyz789"
        }
    },
    
    # ❌ INVALID MESSAGE #1 - Missing required field (user_id)
    {
        "name": "Missing user_id",
        "type": "INVALID - Missing Field",
        "message": {
            "_schema": "user_event",
            "event_type": "purchase",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "product_id": "PROD999"
        }
    },
    
    # ❌ INVALID MESSAGE #2 - Invalid user_id format
    {
        "name": "Invalid user_id format",
        "type": "INVALID - Format Error",
        "message": {
            "_schema": "user_event",
            "user_id": "INVALID123",  # Should be USER123456 format
            "event_type": "purchase",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "product_id": "PROD111"
        }
    },
    
    # ❌ INVALID MESSAGE #3 - Invalid event_type
    {
        "name": "Invalid event_type",
        "type": "INVALID - Enum Violation",
        "message": {
            "_schema": "user_event",
            "user_id": "USER777888",
            "event_type": "invalid_action",  # Not in allowed enum
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "product_id": "PROD222"
        }
    },
    
    # ❌ INVALID MESSAGE #4 - Missing timestamp
    {
        "name": "Missing timestamp",
        "type": "INVALID - Missing Required Field",
        "message": {
            "_schema": "user_event",
            "user_id": "USER999000",
            "event_type": "view",
            "product_id": "PROD333"
        }
    },
    
    # ❌ INVALID MESSAGE #5 - No schema specified
    {
        "name": "No schema specified",
        "type": "INVALID - Missing Schema",
        "message": {
            "user_id": "USER111222",
            "event_type": "purchase",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    },
]

# Send all messages
print("=" * 80)
print("📨 SENDING TEST MESSAGES TO KAFKA")
print("=" * 80)

for i, test in enumerate(test_messages, 1):
    print(f"\n{'='*80}")
    print(f"Message {i}/{len(test_messages)}: {test['name']}")
    print(f"Type: {test['type']}")
    print(f"{'='*80}")
    print(f"Payload: {json.dumps(test['message'], indent=2)}")
    
    try:
        # Send to Kafka
        future = producer.send(RAW_TOPIC, test['message'])
        metadata = future.get(timeout=10)
        
        print(f"\n✅ Sent successfully!")
        print(f"   Topic: {metadata.topic}")
        print(f"   Partition: {metadata.partition}")
        print(f"   Offset: {metadata.offset}")
        
        # Small delay for visibility
        time.sleep(1)
        
    except Exception as e:
        print(f"\n❌ Failed to send: {e}")

# Flush and close
producer.flush()
producer.close()

print("\n" + "=" * 80)
print("🎉 SIMULATION COMPLETE!")
print("=" * 80)
print("\n📊 WHAT TO CHECK NOW:\n")

print("1️⃣  KAFKA UI (http://localhost:8090)")
print("   → Topics → raw-events → Should see 7 messages")
print("   → Topics → validated-events → Should see 2 valid messages ✅")
print("   → Topics → quarantine-dlq → Should see 5 invalid messages ❌")

print("\n2️⃣  API LOGS")
print("   docker logs -f dataquarantine-api")
print("   → Watch validation in real-time")

print("\n3️⃣  MINIO CONSOLE (http://localhost:9001)")
print("   → Buckets → data-quarantine → Should have 5 quarantined files")
print("   → Each file contains the invalid message + error details")

print("\n4️⃣  DBEAVER / POSTGRESQL")
print("   → Query: SELECT * FROM quarantine_records;")
print("   → Should see 5 records with error details")

print("\n5️⃣  PROMETHEUS (http://localhost:9090)")
print("   → Query: dataquarantine_records_processed_total")
print("   → Query: dataquarantine_records_valid_total")
print("   → Query: dataquarantine_records_invalid_total")

print("\n6️⃣  GRAFANA (http://localhost:3001)")
print("   → Create dashboard showing success vs failure rate")

print("\n" + "=" * 80)
print("💡 EXPECTED RESULTS:")
print("=" * 80)
print("✅ Valid Messages: 2")
print("   - USER123456 purchase event")
print("   - USER654321 click event")
print("\n❌ Invalid Messages: 5")
print("   - Missing user_id")
print("   - Invalid user_id format")
print("   - Invalid event_type")
print("   - Missing timestamp")
print("   - No schema specified")
print("=" * 80)
