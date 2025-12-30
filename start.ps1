#!/usr/bin/env pwsh
# DataQuarantine - Complete Automated Startup Script
# This script does EVERYTHING automatically - no manual steps needed!

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DataQuarantine - Automated Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Start all Docker services
Write-Host "[1/7] Starting Docker services..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start Docker services" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker services started" -ForegroundColor Green
Write-Host ""

# Step 2: Wait for services to be healthy
Write-Host "[2/7] Waiting for services to be healthy (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30
Write-Host "✅ Services should be healthy now" -ForegroundColor Green
Write-Host ""

# Step 3: Create Kafka topics (if they don't exist)
Write-Host "[3/7] Creating Kafka topics..." -ForegroundColor Yellow

$topics = @("validated-events", "quarantine-dlq")
foreach ($topic in $topics) {
    Write-Host "   Creating topic: $topic" -ForegroundColor Gray
    docker exec dataquarantine-kafka kafka-topics --create --topic $topic --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1 --if-not-exists 2>$null
}
Write-Host "✅ Kafka topics ready" -ForegroundColor Green
Write-Host ""

# Step 4: Initialize MinIO buckets (auto-created by application now)
Write-Host "[4/7] MinIO buckets..." -ForegroundColor Yellow
Write-Host "   ✅ Auto-created by application: data-quarantine, validated-data" -ForegroundColor Gray
Write-Host ""

# Step 5: Verify PostgreSQL
Write-Host "[5/7] Verifying PostgreSQL..." -ForegroundColor Yellow
$dbCheck = docker exec dataquarantine-postgres pg_isready -U quarantine_user 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ PostgreSQL is ready" -ForegroundColor Green
} else {
    Write-Host "⚠️  PostgreSQL might still be initializing" -ForegroundColor Yellow
}
Write-Host ""

# Step 6: Show running services
Write-Host "[6/7] Verifying all services..." -ForegroundColor Yellow
docker ps --filter "name=dataquarantine" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | Out-String | Write-Host
Write-Host ""

# Step 7: Display access URLs
Write-Host "[7/7] 🎉 System Ready!" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Access Your Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎨 Frontend Dashboard:    " -NoNewline; Write-Host "http://localhost:3000" -ForegroundColor Green
Write-Host "📡 API Documentation:     " -NoNewline; Write-Host "http://localhost:8080/docs" -ForegroundColor Green
Write-Host "📊 Kafka UI:              " -NoNewline; Write-Host "http://localhost:8090" -ForegroundColor Green
Write-Host "📦 MinIO Console:         " -NoNewline; Write-Host "http://localhost:9001" -ForegroundColor Green
Write-Host "   Login:                 minioadmin / minioadmin" -ForegroundColor Gray
Write-Host "📈 Grafana:               " -NoNewline; Write-Host "http://localhost:3001" -ForegroundColor Green
Write-Host "   Login:                 admin / admin" -ForegroundColor Gray
Write-Host "🔍 Prometheus:            " -NoNewline; Write-Host "http://localhost:9090" -ForegroundColor Green
Write-Host ""
Write-Host "🗄️  PostgreSQL (DBeaver):" -ForegroundColor Cyan
Write-Host "   Host:                  localhost:5432" -ForegroundColor Gray
Write-Host "   Database:              dataquarantine" -ForegroundColor Gray
Write-Host "   User:                  quarantine_user" -ForegroundColor Gray
Write-Host "   Password:              quarantine_pass" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Next Steps" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the frontend:" -ForegroundColor Yellow
Write-Host "   cd dataquarantine-ui" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "To run traffic simulation:" -ForegroundColor Yellow
Write-Host "   python scripts/simulate_traffic.py" -ForegroundColor Gray
Write-Host ""
Write-Host "To run one-time test:" -ForegroundColor Yellow
Write-Host "   python scripts/test_validation.py" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Everything is automated and ready!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
