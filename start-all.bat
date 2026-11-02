@echo off
setlocal enabledelayedexpansion

title Voting dApp Launcher

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║     Decentralized Voting dApp - One-Click Launcher    ║
echo ╚════════════════════════════════════════════════════════╝
echo.

:: Check if MongoDB is running
echo [Step 1/7] Checking MongoDB...
sc query MongoDB | find "RUNNING" >nul
if %errorlevel% equ 0 (
    echo ✓ MongoDB is running
) else (
    echo ⚠ Starting MongoDB...
    net start MongoDB >nul 2>&1
    if %errorlevel% neq 0 (
        echo ✗ Failed to start MongoDB
        echo   Please start MongoDB manually: net start MongoDB
        pause
        exit /b 1
    )
    echo ✓ MongoDB started
)
echo.

:: Check dependencies
echo [Step 2/7] Checking dependencies...
set "deps_missing=0"

if not exist "Server\node_modules" (
    echo   Installing Server dependencies...
    cd Server
    call npm install --silent >nul 2>&1
    cd ..
    echo   ✓ Server dependencies installed
    set "deps_missing=1"
)

if not exist "Frontend\node_modules" (
    echo   Installing Frontend dependencies...
    cd Frontend
    call npm install --silent >nul 2>&1
    cd ..
    echo   ✓ Frontend dependencies installed
    set "deps_missing=1"
)

if "!deps_missing!"=="0" (
    echo ✓ All dependencies ready
)
echo.

:: Kill any existing node processes on our ports
echo [Step 3/7] Cleaning up old processes...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173" ^| find "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8545" ^| find "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
echo ✓ Ports cleared
echo.

:: Start Hardhat node in background with logs (single-terminal mode)
echo [Step 4/7] Starting Hardhat blockchain node...
cd Hardhat
if not exist "..\logs" mkdir "..\logs" >nul 2>&1
echo   Launching Hardhat node (logs\\hardhat.log)...
start /b "" cmd /c "npx hardhat node > ..\logs\hardhat.log 2>&1"
echo   Waiting for node to initialize...
timeout /t 3 /nobreak >nul

:: Wait for Hardhat node to be ready (check if port 8545 is listening)
set "node_ready=0"
for /L %%i in (1,1,20) do (
    netstat -an | find ":8545" | find "LISTENING" >nul 2>&1
    if !errorlevel! equ 0 (
        set "node_ready=1"
        goto :node_ready
    )
    timeout /t 1 /nobreak >nul
)

:node_ready
if "!node_ready!"=="0" (
    echo ✗ Hardhat node failed to start
    echo   Please check the Hardhat Node window for errors
    pause
    exit /b 1
)

echo ✓ Hardhat node started on http://127.0.0.1:8545
echo.

:: Deploy contract
echo [Step 5/7] Deploying smart contract...
call npx hardhat run scripts/deploy.js --network localhost > deploy_output.txt 2>&1

if %errorlevel% neq 0 (
    echo ✗ Contract deployment failed
    type deploy_output.txt
    pause
    exit /b 1
)

:: Extract contract and admin addresses robustly
:: Prefer explicit label lines; fall back to first/last 0x... if needed
set "CONTRACT_ADDRESS="
set "ADMIN_ADDRESS="

for /f "usebackq delims=" %%a in (`powershell -NoProfile -Command "$line = Select-String -Path 'deploy_output.txt' -Pattern 'Contract Address' -SimpleMatch | Select-Object -Last 1; if ($line) { if ($line.Line -match '0x[0-9a-fA-F]{40}') { $Matches[0] } }"`) do set "CONTRACT_ADDRESS=%%a"

if "!CONTRACT_ADDRESS!"=="" (
  for /f "usebackq delims=" %%a in (`powershell -NoProfile -Command "$line = Select-String -Path 'deploy_output.txt' -Pattern 'deployed to' -SimpleMatch | Select-Object -First 1; if ($line) { if ($line.Line -match '0x[0-9a-fA-F]{40}') { $Matches[0] } }"`) do set "CONTRACT_ADDRESS=%%a"
)

for /f "usebackq delims=" %%a in (`powershell -NoProfile -Command "$line = Select-String -Path 'deploy_output.txt' -Pattern 'Admin Address' -SimpleMatch | Select-Object -Last 1; if ($line) { if ($line.Line -match '0x[0-9a-fA-F]{40}') { $Matches[0] } }"`) do set "ADMIN_ADDRESS=%%a"

if "!ADMIN_ADDRESS!"=="" (
  for /f "usebackq delims=" %%a in (`powershell -NoProfile -Command "$m = Select-String -Path 'deploy_output.txt' -Pattern '0x[0-9a-fA-F]{40}' -AllMatches ^| ForEach-Object { $_.Matches.Value }; if ($m.Count -ge 1) { $m[$m.Count-1] }"` ) do set "ADMIN_ADDRESS=%%a"
)

if "!CONTRACT_ADDRESS!"=="" (
    echo ✗ Failed to extract contract address
    type deploy_output.txt
    pause
    exit /b 1
)

echo ✓ Contract deployed: !CONTRACT_ADDRESS!

if "!ADMIN_ADDRESS!"=="" (
    echo ✗ Failed to extract admin address
    type deploy_output.txt
    pause
    exit /b 1
)

echo ✓ Admin address: !ADMIN_ADDRESS!

:: Update Server ABI/address JSON from Hardhat artifacts using PowerShell helper
echo.
echo Syncing Server ABI and address (Hardhat\scripts\sync-abi.ps1)...
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\sync-abi.ps1"
if %errorlevel% neq 0 (
  echo ✗ Failed to sync ABI/address. See Hardhat\deploy_output.txt
  type deploy_output.txt
  pause
  exit /b 1
)

cd ..
echo.

:: Step 6: Configuration summary (already synced by sync-abi.ps1)
echo [Step 6/7] Configuration synced from Hardhat artifacts ✓
cd Server
if exist .env (
  echo   • Server/.env present
) else (
  echo   • Warning: Server/.env missing (create it with required variables)
)
cd ..
echo.

:: Start services in background (single terminal) with logs
echo [Step 7/7] Starting application services...
echo.

:: Start Backend
cd Server
echo   Launching Backend (logs\\backend.log)...
start /b "" cmd /c "npm run dev > ..\logs\backend.log 2>&1"
cd ..

:: Wait for backend to initialize
timeout /t 4 /nobreak >nul

:: Start Frontend
cd Frontend
echo   Launching Frontend (logs\\frontend.log)...
start /b "" cmd /c "npm run dev > ..\logs\frontend.log 2>&1"
cd ..

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║              🎉 Application Started!                   ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo 📊 Services Running:
echo   ├─ Hardhat Node:    http://127.0.0.1:8545
echo   ├─ Backend API:     http://localhost:5000
echo   └─ Frontend App:    http://localhost:5173
echo.
echo 📝 Contract Information:
echo   ├─ Address:         !CONTRACT_ADDRESS!
echo   └─ Admin:           !ADMIN_ADDRESS!
echo.
echo 🔧 Configuration:
echo   ├─ ABI:             Auto-updated ✓
echo   ├─ Contract Addr:   Auto-updated ✓
echo   └─ Admin Role:      Database-based ✓
echo.
echo 💡 Next Steps:
echo   1. Wait 10-15 seconds for all services to start
echo   2. Browser will open automatically
echo   3. Register first user - they will be admin automatically
echo   4. Admin can manage elections and users
echo.

:: Wait a bit more for services to fully start
echo Waiting for services to initialize...
timeout /t 10 /nobreak >nul

:: Open browser
echo Opening application in browser...
start http://localhost:5173

echo.
echo ✅ All done! Application is ready to use.
echo.
echo 📌 Logs (current terminal):
echo   • Hardhat:   .\logs\hardhat.log
echo   • Backend:   .\logs\backend.log
echo   • Frontend:  .\logs\frontend.log
echo.
echo 🛑 To stop: terminate this terminal (background processes will stop)
echo.
pause
