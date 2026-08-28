#!/usr/bin/env pwsh
# Restart all development servers for Al-Amanah-V1 project
# Usage: .\scripts\restart-all.ps1

$ErrorActionPreference = "SilentlyContinue"

Write-Host "🔄 Restarting all development servers..." -ForegroundColor Yellow
Write-Host ""

# Stop all servers
Write-Host "🛑 Stopping existing servers..." -ForegroundColor Red
Get-Process | Where-Object {$_.ProcessName -eq "pocketbase"} | Stop-Process -Force
Get-Process | Where-Object {$_.ProcessName -eq "node" -and $_.CommandLine -like "*api*"} | Stop-Process -Force
Get-Process | Where-Object {$_.ProcessName -eq "node" -and $_.CommandLine -like "*vite*"} | Stop-Process -Force
Start-Sleep -Seconds 2
Write-Host "✅ All servers stopped" -ForegroundColor Green
Write-Host ""

# Start all servers
& "$PSScriptRoot\start-all.ps1"
