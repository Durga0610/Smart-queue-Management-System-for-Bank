$env:PATH = "$PWD\.local\node22\node-v22.14.0-win-x64;$env:PATH"
if (!(Test-Path "$PWD\.local\node22\node-v22.14.0-win-x64\pnpm.cmd")) {
    npm install -g pnpm
}
pnpm install

$env:PORT="5000"
$env:BASE_PATH="/"

Write-Host "Ensuring Database Schema is up to date..." -ForegroundColor Cyan
pnpm.cmd --filter @workspace/db run push

Write-Host "Building Frontend..." -ForegroundColor Cyan
pnpm.cmd --filter ./frontend run build

Write-Host "Starting Unified Server on PORT 5000..." -ForegroundColor Cyan
$env:PORT="5000"
$env:DATABASE_URL="$PWD\sqlite.db"
pnpm.cmd --filter ./backend run dev
