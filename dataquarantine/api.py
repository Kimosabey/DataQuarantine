from fastapi import FastAPI, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import time

from dataquarantine.core.database import get_db
from dataquarantine.core.models import QuarantineRecord
from dataquarantine.config.settings import settings

app = FastAPI(title="DataQuarantine API", version=settings.app_version)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.app_version}

# Simulation state
START_TIME = time.time()
BASE_METRICS = {
    "total_processed": 1250430,
    "total_valid": 1238200,
    "total_invalid": 12230
}

@app.get("/api/metrics")
async def get_metrics():
    # Simulate dynamic real-time data for the dashboard
    # This ensures the chart always shows activity even if the backend traffic generator isn't active
    elapsed = time.time() - START_TIME
    
    # Simulate ~500 events per second
    new_processed = int(elapsed * 500)
    new_valid = int(elapsed * 490)  # 98% valid
    new_invalid = new_processed - new_valid
    
    current_processed = BASE_METRICS["total_processed"] + new_processed
    current_valid = BASE_METRICS["total_valid"] + new_valid
    current_invalid = BASE_METRICS["total_invalid"] + new_invalid
    
    throughput = 500  # Constant throughput for demo
    
    return {
        "total_processed": current_processed,
        "total_valid": current_valid,
        "total_invalid": current_invalid,
        "validation_rate": round((current_valid / current_processed) * 100, 2),
        "throughput": throughput,
        "error_breakdown": {
            "missing_field": 4520 + int(new_invalid * 0.4),
            "bad_type": 3810 + int(new_invalid * 0.3),
            "malformed_json": 2100 + int(new_invalid * 0.2),
            "schema_mismatch": 1800 + int(new_invalid * 0.1)
        }
    }

@app.get("/api/quarantine/records")
async def get_quarantine_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    topic: Optional[str] = None,
    error_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(QuarantineRecord)
    
    if topic:
        query = query.filter(QuarantineRecord.topic == topic)
    if error_type:
        query = query.filter(QuarantineRecord.error_type == error_type)
        
    total = query.count()
    items = query.order_by(QuarantineRecord.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@app.get("/api/quarantine/records/{record_id}")
async def get_quarantine_record(record_id: str, db: Session = Depends(get_db)):
    record = db.query(QuarantineRecord).filter(QuarantineRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record
