# Setup script for Unique Finance Tracker (QueueLess)
$ErrorActionPreference = "Stop"

Write-Host "--- Environment Setup ---" -ForegroundColor Cyan

# 1. Check Node.js version
$nodeVersion = node -v
Write-Host "Detected Node.js version: $nodeVersion"

# Vite 7 requires Node 20.19+ or 22.12+
# We'll just warn if it's below that but try to proceed as system node is 24.15.0
if ($nodeVersion -match "v(\d+)\.(\d+)\.(\d+)") {
    $major = [int]$matches[1]
    if ($major -lt 20) {
        Write-Error "Node.js version 20 or higher is required."
    }
}

# 2. Check/Install pnpm
if (!(Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "pnpm not found. Attempting to install locally..." -ForegroundColor Yellow
    npm install -g pnpm --quiet
}

# 3. Environment Variables
if (!(Test-Path ".env")) {
    Write-Host "Creating default .env file..." -ForegroundColor Green
    @"
PORT=5173
BASE_PATH=/
DATABASE_URL=postgres://postgres:postgres@localhost:5432/queueless
SESSION_SECRET=dev-secret-change-me
"@ | Out-File -FilePath ".env" -Encoding utf8
}

# 4. Install Dependencies
Write-Host "Installing dependencies..." -ForegroundColor Cyan
pnpm install

Write-Host "--- Setup Complete! ---" -ForegroundColor Cyan
Write-Host "To start the app, run: pnpm run dev"
