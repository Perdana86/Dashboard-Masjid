#!/usr/bin/env pwsh
# Start all development servers for Al-Amanah-V1 project
# Usage: .\scripts\start-all.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting all development servers..." -ForegroundColor Green
Write-Host ""

# Get the root directory of the project
$RootDir = $PSScriptRoot | Split-Path -Parent
$AppsDir = Join-Path $RootDir "apps"

# Function to check if port is already in use
function Test-PortInUse {
    param([int]$Port)
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return $null -ne $connection
}

# Start PocketBase
$PocketBaseDir = Join-Path $AppsDir "pocketbase"
Write-Host "📦 Starting PocketBase on port 8090..." -ForegroundColor Cyan
if (Test-PortInUse -Port 8090) {
    Write-Host "⚠️  PocketBase already running on port 8090" -ForegroundColor Yellow
} else {
    Set-Location $PocketBaseDir
    $env:PB_ENCRYPTION_KEY = "ThisIsA32CharacterSecretKey12345"
    $env:PB_SUPERUSER_EMAIL = "admin@admin.com"
    $env:PB_SUPERUSER_PASSWORD = "password"
    Start-Process "pwsh" -ArgumentList "-NoExit", "-Command", "cd '$PocketBaseDir'; `$env:PB_ENCRYPTION_KEY='ThisIsA32CharacterSecretKey12345'; `$env:PB_SUPERUSER_EMAIL='admin@admin.com'; `$env:PB_SUPERUSER_PASSWORD='password123'; ./pocketbase.exe serve --http=127.0.0.1:8090" -WindowStyle Normal
    Write-Host "✅ PocketBase started" -ForegroundColor Green
}

# Wait a bit for PocketBase to fully start
Start-Sleep -Seconds 2

# Start API Server
$ApiDir = Join-Path $AppsDir "api"
Write-Host "🔌 Starting API Server on port 3001..." -ForegroundColor Cyan
if (Test-PortInUse -Port 3001) {
    Write-Host "⚠️  API Server already running on port 3001" -ForegroundColor Yellow
} else {
    Set-Location $ApiDir
    Start-Process "pwsh" -ArgumentList "-NoExit", "-Command", "cd '$ApiDir'; npm run dev" -WindowStyle Normal
    Write-Host "✅ API Server started" -ForegroundColor Green
}

# Wait a bit for API to fully start
Start-Sleep -Seconds 2

# Start Web (Vite)
$WebDir = Join-Path $AppsDir "web"
Write-Host "🌐 Starting Web (Vite) on port 5000..." -ForegroundColor Cyan
if (Test-PortInUse -Port 3000) {
    Write-Host "⚠️  Web server already running on port 5000" -ForegroundColor Yellow
} else {
    Set-Location $WebDir
    Start-Process "pwsh" -ArgumentList "-NoExit", "-Command", "cd '$WebDir'; npm run dev" -WindowStyle Normal
    Write-Host "✅ Web server started" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 All servers started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Access points:" -ForegroundColor Yellow
Write-Host "   Web App:      http://localhost:5000" -ForegroundColor White
Write-Host "   API Server:   http://localhost:3001" -ForegroundColor White
Write-Host "   PocketBase:   http://localhost:8090" -ForegroundColor White
Write-Host ""
Write-Host "🛑 To stop all servers, run: .\scripts\stop-all.ps1" -ForegroundColor Yellow
Write-Host ""

# Return to root directory
Set-Location $RootDir
