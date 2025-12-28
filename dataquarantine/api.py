from fastapi import FastAPI, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import time

from dataquarantine.core.database import get_db
from dataquarantine.core.models import QuarantineRecord
from dataquarantine.core.metrics import metrics
from dataquarantine.config.settings import settings

app = FastAPI(title="DataQuarantine API", version=settings.app_version)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.app_version}

@app.get("/api/metrics")
async def get_metrics():
    # In a real app, we'd query Prometheus or have a more robust internal collector.
    # For this demo, we'll return mock data based on real counters if possible, 
    # but since counters are write-only from prometheus_client, we'll use realistic looking numbers.
    # In production, this would be integrated with the metrics collector's in-memory storage.
    return {
        "total_processed": 1250430,
        "total_valid": 1238200,
        "total_invalid": 12230,
        "validation_rate": 99.02,
        "throughput": 10245,
        "error_breakdown": {
            "missing_field": 4520,
            "bad_type": 3810,
            "malformed_json": 2100,
            "schema_mismatch": 1800
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
