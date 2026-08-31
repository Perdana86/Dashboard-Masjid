#!/usr/bin/env pwsh

# Post-Deploy Setup Script untuk Windows PowerShell
# Script ini akan:
# 1. Set permissions untuk PocketBase binary
# 2. Install dependencies jika belum
# 3. Build frontend jika belum
# 4. Setup environment variables

$ErrorActionPreference = "Stop"

$RootDir = $PSScriptRoot | Split-Path -Parent
$PocketBaseBinary = Join-Path $RootDir "apps\pocketbase\pocketbase.exe"

Write-Host ""
Write-Host "🔧 Post-Deploy Setup - Dashboard Masjid" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📁 Working directory: $RootDir" -ForegroundColor Gray
Write-Host ""

# Step 1: Check PocketBase binary
Write-Host "📝 Step 1: Checking PocketBase binary..." -ForegroundColor Yellow

if (Test-Path $PocketBaseBinary) {
    Write-Host "✅ PocketBase binary found" -ForegroundColor Green
    Write-Host "   Location: $PocketBaseBinary" -ForegroundColor Gray
} else {
    Write-Host "❌ PocketBase binary not found!" -ForegroundColor Red
    Write-Host "   Please download PocketBase from https://pocketbase.io/docs/" -ForegroundColor Red
    Write-Host "   and place it at: $PocketBaseBinary" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Check dependencies
Write-Host "📦 Step 2: Checking dependencies..." -ForegroundColor Yellow

$Dependencies = @(
    @{Path = "$RootDir"; Name = "Root"},
    @{Path = "$RootDir\apps\web"; Name = "Web"},
    @{Path = "$RootDir\apps\api"; Name = "API"},
    @{Path = "$RootDir\apps\pocketbase"; Name = "PocketBase"}
)

foreach ($Dep in $Dependencies) {
    $NodeModules = Join-Path $Dep.Path "node_modules"
    if (Test-Path $NodeModules) {
        Write-Host "✅ $($Dep.Name) dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "   Installing $($Dep.Name) dependencies..." -ForegroundColor Cyan
        Set-Location $Dep.Path
        npm install
    }
}

Write-Host ""

# Step 3: Check build
Write-Host "🔨 Step 3: Checking build..." -ForegroundColor Yellow

$BuildDir = Join-Path $RootDir "dist\apps\web"
if (Test-Path $BuildDir) {
    Write-Host "✅ Build already exists" -ForegroundColor Green
} else {
    Write-Host "   Build not found. Building frontend..." -ForegroundColor Cyan
    Set-Location $RootDir
    npm run build
    Write-Host "✅ Build completed" -ForegroundColor Green
}

Write-Host ""

# Step 4: Check environment files
Write-Host "⚙️  Step 4: Checking environment files..." -ForegroundColor Yellow

$EnvFiles = @(
    "$RootDir\apps\pocketbase\.env",
    "$RootDir\apps\api\.env",
    "$RootDir\apps\web\.env"
)

foreach ($EnvFile in $EnvFiles) {
    $FolderName = Split-Path (Split-Path $EnvFile -Parent) -Leaf
    if (Test-Path $EnvFile) {
        Write-Host "✅ $FolderName\.env exists" -ForegroundColor Green
    } else {
        Write-Host "⚠️  $FolderName\.env not found" -ForegroundColor Yellow
        Write-Host "   Please create this file with appropriate environment variables" -ForegroundColor Yellow
    }
}

Write-Host ""

# Step 5: Setup PM2 (optional)
Write-Host "🚀 Step 5: PM2 Setup (optional)..." -ForegroundColor Yellow
$SetupPM2 = Read-Host "Do you want to setup PM2 for process management? (y/n)"

if ($SetupPM2 -eq 'y' -or $SetupPM2 -eq 'Y') {
    try {
        $pm2Version = pm2 --version 2>&1
        Write-Host "✅ PM2 already installed: $pm2Version" -ForegroundColor Green
    } catch {
        Write-Host "   Installing PM2..." -ForegroundColor Cyan
        npm install -g pm2
    }
    
    Write-Host "   Setting up PM2 startup..." -ForegroundColor Cyan
    pm2 startup
    
    Write-Host "   Saving PM2 configuration..." -ForegroundColor Cyan
    pm2 save
    
    Write-Host "✅ PM2 setup completed" -ForegroundColor Green
} else {
    Write-Host "⏭️  Skipping PM2 setup" -ForegroundColor Yellow
}

Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Post-Deploy Setup Completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Review and update environment variables in .env files" -ForegroundColor White
Write-Host "   2. Start the application:" -ForegroundColor White
Write-Host "      - Using PM2: pm2 start ecosystem.config.js" -ForegroundColor White
Write-Host "      - Manual: npm run start" -ForegroundColor White
Write-Host "   3. Setup Nginx reverse proxy (see DEPLOYMENT.md)" -ForegroundColor White
Write-Host "   4. Setup SSL certificate (see DEPLOYMENT.md)" -ForegroundColor White
Write-Host ""
Write-Host "📖 Documentation:" -ForegroundColor Cyan
Write-Host "   - PM2 Guide: PM2-GUIDE.md" -ForegroundColor White
Write-Host "   - Deployment: DEPLOYMENT.md" -ForegroundColor White
Write-Host "   - Quick Deploy: DEPLOY.md" -ForegroundColor White
Write-Host ""
