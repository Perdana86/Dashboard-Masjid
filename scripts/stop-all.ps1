#!/usr/bin/env pwsh
# Stop all development servers for Al-Amanah-V1 project
# Usage: .\scripts\stop-all.ps1

$ErrorActionPreference = "SilentlyContinue"

Write-Host "🛑 Stopping all development servers..." -ForegroundColor Red
Write-Host ""

# Stop PocketBase
Write-Host "📦 Stopping PocketBase..." -ForegroundColor Cyan
Get-Process | Where-Object {$_.ProcessName -eq "pocketbase"} | Stop-Process -Force
Write-Host "✅ PocketBase stopped" -ForegroundColor Green

# Stop API Server
Write-Host "🔌 Stopping API Server..." -ForegroundColor Cyan
Get-Process | Where-Object {$_.ProcessName -eq "node" -and $_.CommandLine -like "*api*"} | Stop-Process -Force
Write-Host "✅ API Server stopped" -ForegroundColor Green

# Stop Web (Vite)
Write-Host "🌐 Stopping Web (Vite)..." -ForegroundColor Cyan
Get-Process | Where-Object {$_.ProcessName -eq "node" -and $_.CommandLine -like "*vite*"} | Stop-Process -Force
Write-Host "✅ Web server stopped" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 All servers stopped successfully!" -ForegroundColor Green
Write-Host ""
