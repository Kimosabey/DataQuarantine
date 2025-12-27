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
        "event_id": str(uuid.uuid4()),
        "event_type": random.choice(["login", "logout", "purchase", "page_view"]),
        "user_id": f"USER-{random.randint(1000, 9999)}",
        "timestamp": datetime.now().isoformat(),
        "payload": {
            "browser": "Chrome",
            "os": "Windows",
            "duration": random.randint(1, 100)
        }
    }

def create_invalid_event():
    """Generates an invalid event (missing fields, bad types, etc.)."""
    error_type = random.choice(["missing_field", "bad_type", "malformed_json"])
    
    event = create_valid_event()
    
    if error_type == "missing_field":
        # Remove a required field
        del event["event_type"]
    elif error_type == "bad_type":
        # Change a string to a number
        event["user_id"] = 12345
    elif error_type == "malformed_json":
        # Just return a string instead of JSON object
        return "Not even JSON data"
        
    return event

def main():
    print(f"Starting Traffic Simulation to {BOOTSTRAP_SERVERS}...")
    
    try:
        producer = KafkaProducer(
            bootstrap_servers=BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode('utf-8') if isinstance(v, dict) else v.encode('utf-8')
        )
        print("Connected to Kafka! Press Ctrl+C to stop.")
        
        count = 0
        try:
            while True:
                # 80% chance of valid data, 20% chance of invalid
                if random.random() < 0.8:
                    event = create_valid_event()
                    status = "[VALID]"
                else:
                    event = create_invalid_event()
                    status = "[INVALID]"
                
                producer.send(TOPIC_NAME, event)
                count += 1
                
                if count % 10 == 0:
                    print(f"[{count}] Sent {status} event (Stream active...)")
                
                # Sleep a bit to simulate realistic traffic (10 events/sec)
                time.sleep(0.1)
                
        except KeyboardInterrupt:
            print("\nSimulation stopped.")
            
    except Exception as e:
        print(f"\nError: {e}")
        print("Make sure your Kafka container is running and accessible on localhost:9092")

if __name__ == "__main__":
    main()
