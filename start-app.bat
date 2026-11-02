@echo off
setlocal enabledelayedexpansion

echo ========================================
echo  Decentralized Voting dApp - Launcher
echo ========================================
echo.

:: Check if MongoDB is running
echo [1/6] Checking MongoDB...
sc query MongoDB | find "RUNNING" >nul
if %errorlevel% equ 0 (
    echo ✓ MongoDB is running
) else (
    echo Starting MongoDB...
    net start MongoDB
    if %errorlevel% neq 0 (
        echo ✗ Failed to start MongoDB
        echo Please start MongoDB manually: net start MongoDB
        pause
        exit /b 1
    )
    echo ✓ MongoDB started
)
echo.

:: Check if node_modules exist
echo [2/6] Checking dependencies...
if not exist "Server\node_modules" (
    echo Installing Server dependencies...
    cd Server
    call npm install
    cd ..
)
if not exist "Frontend\node_modules" (
    echo Installing Frontend dependencies...
    cd Frontend
    call npm install
    cd ..
)
echo ✓ Dependencies ready
echo.

:: Start Hardhat node in background
echo [3/6] Starting Hardhat blockchain node...
cd Hardhat
start "Hardhat Node" cmd /k "npx hardhat node"
echo Waiting for Hardhat node to initialize...
timeout /t 5 /nobreak >nul
echo ✓ Hardhat node started
echo.

:: Deploy smart contract and capture output
echo [4/6] Deploying smart contract...
npx hardhat run scripts/deploy.js --network localhost > deploy_output.txt 2>&1

:: Extract contract address from deployment output
for /f "tokens=*" %%a in ('findstr /C:"VotingSystem deployed to:" deploy_output.txt') do (
    set "deploy_line=%%a"
)

:: Parse the address
for /f "tokens=5" %%b in ("!deploy_line!") do (
    set "CONTRACT_ADDRESS=%%b"
)

if "!CONTRACT_ADDRESS!"=="" (
    echo ✗ Failed to deploy contract or extract address
    type deploy_output.txt
    pause
    exit /b 1
)

echo ✓ Contract deployed to: !CONTRACT_ADDRESS!

:: Extract admin address
for /f "tokens=*" %%a in ('findstr /C:"Admin address:" deploy_output.txt') do (
    set "admin_line=%%a"
)
for /f "tokens=3" %%b in ("!admin_line!") do (
    set "ADMIN_ADDRESS=%%b"
)

echo ✓ Admin address: !ADMIN_ADDRESS!
echo.

:: Update Server .env file
echo [5/6] Updating configuration files...
cd ..\Server

:: Read existing .env and update CONTRACT_ADDRESS
if exist .env (
    powershell -Command "(Get-Content .env) -replace 'CONTRACT_ADDRESS=.*', 'CONTRACT_ADDRESS=!CONTRACT_ADDRESS!' | Set-Content .env"
    echo ✓ Updated CONTRACT_ADDRESS in Server/.env
) else (
    echo ✗ Server/.env file not found
    echo Please create Server/.env file first
    pause
    exit /b 1
)

:: Note: ADMIN_PRIVATE_KEY needs to be manually copied from Hardhat node output
echo.
echo ⚠️  IMPORTANT: Copy the private key from Hardhat Node window
echo     Look for "Account #0" private key and update Server/.env
echo     ADMIN_PRIVATE_KEY=<paste_private_key_here>
echo.

cd ..
echo ✓ Configuration updated
echo.

:: Start Backend Server
echo [6/6] Starting services...
cd Server
start "Backend Server" cmd /k "npm run dev"
echo ✓ Backend server starting on http://localhost:5000
echo.

:: Wait a moment for backend to initialize
timeout /t 3 /nobreak >nul

:: Start Frontend
cd ..\Frontend
start "Frontend App" cmd /k "npm run dev"
echo ✓ Frontend app starting on http://localhost:5173
echo.

echo ========================================
echo  🎉 Application Started Successfully!
echo ========================================
echo.
echo Services Running:
echo   • Hardhat Node:    http://127.0.0.1:8545
echo   • Backend API:     http://localhost:5000
echo   • Frontend App:    http://localhost:5173
echo.
echo Contract Details:
echo   • Address:         !CONTRACT_ADDRESS!
echo   • Admin:           !ADMIN_ADDRESS!
echo.
echo ⚠️  NEXT STEP REQUIRED:
echo   1. Check the "Hardhat Node" window
echo   2. Copy the Private Key from "Account #0"
echo   3. Update Server/.env:
echo      ADMIN_PRIVATE_KEY=<paste_key_here>
echo   4. Restart backend: Close "Backend Server" window and run:
echo      cd Server ^&^& npm run dev
echo.
echo Press any key to open the application in browser...
pause >nul

:: Open browser
start http://localhost:5173

echo.
echo Application is ready! Check the terminal windows for logs.
echo To stop all services, close all terminal windows.
echo.
pause
