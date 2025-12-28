from sqlalchemy import Column, Integer, String, DateTime, BigInt, Text
from sqlalchemy.dialects.postgresql import UUID
import datetime
import uuid
from dataquarantine.core.database import Base

class QuarantineRecord(Base):
    __tablename__ = "quarantine_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    topic = Column(String, nullable=False)
    partition = Column(Integer, nullable=False)
    offset = Column(BigInt, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    schema_name = Column(String, nullable=False)
    schema_version = Column(String, nullable=False)
    error_type = Column(String, nullable=False)
    error_message = Column(Text, nullable=False)
    field_path = Column(String)
    storage_path = Column(String, nullable=False)
    status = Column(String, default="quarantined")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
