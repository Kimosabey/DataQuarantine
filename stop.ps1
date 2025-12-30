#!/usr/bin/env pwsh
# DataQuarantine - Complete Shutdown Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DataQuarantine - Shutting Down" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Stopping all services..." -ForegroundColor Yellow
docker-compose down

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ All services stopped successfully" -ForegroundColor Green
    Write-Host ""
    Write-Host "To start again, run: .\start.ps1" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "❌ Error stopping services" -ForegroundColor Red
}
Write-Host ""
