#!/usr/bin/env pwsh

# Build script for monorepo
Write-Host "Building web application..." -ForegroundColor Cyan

$webDir = Join-Path $PSScriptRoot ".." "apps" "web"
$rootDir = Join-Path $PSScriptRoot ".."
$originalDir = Get-Location

try {
    Set-Location $webDir
    
    # Run generate-llms.js (ignore errors)
    Write-Host "Generating LLMs..." -ForegroundColor Gray
    node tools/generate-llms.js 2>&1 | Out-Null
    
    # Run vite build directly with output (using root node_modules)
    Write-Host "Running Vite build..." -ForegroundColor Gray
    $vitePath = Join-Path $rootDir "node_modules\.bin\vite.cmd"
    & $vitePath build --outDir ../../dist/apps/web
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✓ Build completed successfully!" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "`n✗ Build failed!" -ForegroundColor Red
        exit $LASTEXITCODE
    }
} finally {
    Set-Location $originalDir
}
