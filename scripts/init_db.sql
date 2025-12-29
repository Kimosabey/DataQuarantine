-- DataQuarantine Database Initialization Script
-- This script creates all necessary tables and indexes

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Quarantine records table
CREATE TABLE IF NOT EXISTS quarantine_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic VARCHAR(255) NOT NULL,
    partition INTEGER NOT NULL,
    kafka_offset BIGINT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    schema_name VARCHAR(255) NOT NULL,
    schema_version VARCHAR(50) NOT NULL,
    error_type VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    field_path VARCHAR(500),
    storage_path VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'quarantined',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicates
    UNIQUE(topic, partition, kafka_offset)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_quarantine_topic ON quarantine_records(topic);
CREATE INDEX IF NOT EXISTS idx_quarantine_schema ON quarantine_records(schema_name);
CREATE INDEX IF NOT EXISTS idx_quarantine_error_type ON quarantine_records(error_type);
CREATE INDEX IF NOT EXISTS idx_quarantine_timestamp ON quarantine_records(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_quarantine_status ON quarantine_records(status);
CREATE INDEX IF NOT EXISTS idx_quarantine_created_at ON quarantine_records(created_at DESC);

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_quarantine_topic_schema ON quarantine_records(topic, schema_name);
CREATE INDEX IF NOT EXISTS idx_quarantine_topic_error ON quarantine_records(topic, error_type);

-- Schema registry table
CREATE TABLE IF NOT EXISTS schemas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    schema_type VARCHAR(50) NOT NULL,
    schema_definition JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(100),
    
    UNIQUE(name, version)
);

-- Index for schema lookups
CREATE INDEX IF NOT EXISTS idx_schemas_name ON schemas(name);
CREATE INDEX IF NOT EXISTS idx_schemas_name_version ON schemas(name, version);

-- Validation metrics table (for historical analysis)
CREATE TABLE IF NOT EXISTS validation_metrics (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    topic VARCHAR(255) NOT NULL,
    schema_name VARCHAR(255) NOT NULL,
    total_processed INTEGER NOT NULL DEFAULT 0,
    total_valid INTEGER NOT NULL DEFAULT 0,
    total_invalid INTEGER NOT NULL DEFAULT 0,
    avg_duration_ms FLOAT NOT NULL DEFAULT 0,
    p99_duration_ms FLOAT,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Unique constraint for time-series data
    UNIQUE(timestamp, topic, schema_name)
);

-- Indexes for metrics queries
CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON validation_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_topic ON validation_metrics(topic);
CREATE INDEX IF NOT EXISTS idx_metrics_schema ON validation_metrics(schema_name);

-- Reprocessing log table
CREATE TABLE IF NOT EXISTS reprocessing_log (
    id SERIAL PRIMARY KEY,
    quarantine_record_id UUID REFERENCES quarantine_records(id),
    reprocessed_at TIMESTAMP DEFAULT NOW(),
    reprocessed_by VARCHAR(100),
    outcome VARCHAR(50), -- 'success', 'failed', 'skipped'
    notes TEXT
);

-- Index for reprocessing lookups
CREATE INDEX IF NOT EXISTS idx_reprocessing_record_id ON reprocessing_log(quarantine_record_id);
CREATE INDEX IF NOT EXISTS idx_reprocessing_timestamp ON reprocessing_log(reprocessed_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_quarantine_records_updated_at
    BEFORE UPDATE ON quarantine_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample schema for testing
INSERT INTO schemas (name, version, schema_type, schema_definition, description, created_by)
VALUES (
    'user_event',
    '1.0.0',
    'json_schema',
    '{
        "type": "object",
        "properties": {
            "user_id": {"type": "string"},
            "event_type": {"type": "string"},
            "timestamp": {"type": "string", "format": "date-time"}
        },
        "required": ["user_id", "event_type", "timestamp"]
    }'::jsonb,
    'User behavior events schema',
    'system'
) ON CONFLICT (name, version) DO NOTHING;

-- Create view for quarantine summary
CREATE OR REPLACE VIEW quarantine_summary AS
SELECT 
    topic,
    schema_name,
    error_type,
    COUNT(*) as count,
    MIN(created_at) as first_seen,
    MAX(created_at) as last_seen
FROM quarantine_records
WHERE status = 'quarantined'
GROUP BY topic, schema_name, error_type
ORDER BY count DESC;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO quarantine_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO quarantine_user;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ DataQuarantine database initialized successfully!';
    RAISE NOTICE 'Tables created: quarantine_records, schemas, validation_metrics, reprocessing_log';
    RAISE NOTICE 'Views created: quarantine_summary';
END $$;
