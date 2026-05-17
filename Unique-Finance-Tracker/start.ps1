$env:PATH = "$PWD\.local\node\node-v20.12.2-win-x64;$env:PATH"
if (!(Test-Path "$PWD\.local\node\node-v20.12.2-win-x64\pnpm.cmd")) {
    npm install -g pnpm
}
pnpm install

$env:PORT="5173"
$env:BASE_PATH="/"

Write-Host "Starting Backend on PORT 5000..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PATH = `"$PWD\.local\node\node-v20.12.2-win-x64;`$env:PATH`"; `$env:PORT=`"5000`"; `$env:BASE_PATH=`"/`"; pnpm --filter ./backend run dev"

Write-Host "Starting Frontend on PORT 5173..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PATH = `"$PWD\.local\node\node-v20.12.2-win-x64;`$env:PATH`"; `$env:PORT=`"5173`"; `$env:BASE_PATH=`"/`"; pnpm --filter ./frontend run dev"
