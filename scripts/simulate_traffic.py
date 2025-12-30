import json
import time
import random
import uuid
import sys
from datetime import datetime

try:
    from kafka import KafkaProducer
except ImportError:
    print("Error: 'kafka-python' library is missing.")
    print("Please install it running: pip install kafka-python")
    sys.exit(1)

# Configuration
TOPIC_NAME = "raw-events"
BOOTSTRAP_SERVERS = ["localhost:9092"]

def create_valid_event():
    """Generates a perfectly valid event matching the schema."""
    return {
        "_schema": "user_event",
        "event_type": random.choice(["view", "click", "purchase", "add_to_cart", "remove_from_cart"]),
        "user_id": f"USER{random.randint(100000, 999999)}",  # 6 digits
        "timestamp": datetime.now().isoformat() + "Z",
        "product_id": f"PROD{random.randint(100, 999)}",
        "session_id": f"sess_{uuid.uuid4().hex[:8]}"
    }

def create_invalid_event():
    """Generates various types of invalid events for testing error handling."""
    error_type = random.choice([
        "missing_field", 
        "bad_type", 
        "malformed_json",
        "invalid_user_id_format",
        "missing_schema",
        "invalid_event_type",
        "future_timestamp"
    ])
    
    event = create_valid_event()
    
    if error_type == "missing_field":
        # Remove a required field
        field_to_remove = random.choice(["event_type", "user_id", "timestamp"])
        if field_to_remove in event:
            del event[field_to_remove]
    
    elif error_type == "bad_type":
        # Change a string to a number
        event["user_id"] = random.randint(1000, 9999)
    
    elif error_type == "malformed_json":
        # Return a string instead of JSON object
        return "Not even JSON data - corrupt message"
    
    elif error_type == "invalid_user_id_format":
        # Wrong user_id format (should be USER123456)
        event["user_id"] = f"USER-{random.randint(1000, 9999)}"  # Wrong format
    
    elif error_type == "missing_schema":
        # Missing _schema field
        del event["_schema"]
    
    elif error_type == "invalid_event_type":
        # Invalid event type (not in enum)
        event["event_type"] = random.choice(["login", "logout", "signup", "invalid_action"])
    
    elif error_type == "future_timestamp":
        # Timestamp in the future (business rule violation)
        from datetime import timedelta
        future_time = datetime.now() + timedelta(days=1)
        event["timestamp"] = future_time.isoformat()
        
    return event

def main():
    print(f">> Starting DataQuarantine Traffic Simulation to {BOOTSTRAP_SERVERS}...")
    print("=" * 70)
    
    try:
        producer = KafkaProducer(
            bootstrap_servers=BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode('utf-8') if isinstance(v, dict) else v.encode('utf-8')
        )
        print("[OK] Connected to Kafka! Press Ctrl+C to stop.\n")
        
        count = 0
        valid_count = 0
        invalid_count = 0
        
        try:
            while True:
                # 75% chance of valid data, 25% chance of invalid
                if random.random() < 0.75:
                    event = create_valid_event()
                    status = "[VALID]"
                    valid_count += 1
                else:
                    event = create_invalid_event()
                    status = "[INVALID]"
                    invalid_count += 1
                
                producer.send(TOPIC_NAME, event)
                count += 1
                
                if count % 10 == 0:
                    ratio = (valid_count / count * 100) if count > 0 else 0
                    print(f"[{count:05d}] {status} | Valid: {valid_count} | Invalid: {invalid_count} | Success Rate: {ratio:.1f}%")
                
                # Sleep a bit to simulate realistic traffic (10 events/sec)
                time.sleep(0.1)
                
        except KeyboardInterrupt:
            print(f"[STOP] Simulation stopped.")
            print(f"[STATS] Final Stats:")
            print(f"   Total Sent: {count}")
            print(f"   Valid: {valid_count} ({valid_count/count*100:.1f}%)")
            print(f"   Invalid: {invalid_count} ({invalid_count/count*100:.1f}%)")
            print("=" * 70)
            
    except Exception as e:
        print(f"\n[ERROR] {e}")
        print("Make sure your Kafka container is running and accessible on localhost:9092")

if __name__ == "__main__":
    main()
