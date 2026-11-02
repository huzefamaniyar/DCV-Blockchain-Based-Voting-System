@echo off
echo ========================================
echo  Decentralized Voting dApp - Installer
echo ========================================
echo.

echo [1/4] Installing Server dependencies...
cd Server
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Server dependencies installation failed!
    pause
    exit /b 1
)
echo ✓ Server dependencies installed
echo.

echo [2/4] Installing Frontend dependencies...
cd ..\Frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Frontend dependencies installation failed!
    pause
    exit /b 1
)
echo ✓ Frontend dependencies installed
echo.

echo [3/4] Checking MongoDB status...
sc query MongoDB | find "RUNNING" >nul
if %errorlevel% equ 0 (
    echo ✓ MongoDB is running
) else (
    echo ⚠ MongoDB is not running. Starting MongoDB...
    net start MongoDB
    if %errorlevel% neq 0 (
        echo ⚠ Could not start MongoDB automatically
        echo Please start MongoDB manually: net start MongoDB
    ) else (
        echo ✓ MongoDB started
    )
)
echo.

echo [4/4] Installation complete!
echo.
echo ========================================
echo  Next Steps:
echo ========================================
echo 1. Configure Server/.env file
echo 2. Configure Frontend/.env file
echo 3. Deploy smart contract:
echo    cd Hardhat
echo    npx hardhat node (Terminal 1)
echo    npx hardhat run scripts/deploy.js --network localhost (Terminal 2)
echo 4. Update CONTRACT_ADDRESS in Server/.env
echo 5. Start backend: cd Server ^&^& npm run dev
echo 6. Start frontend: cd Frontend ^&^& npm run dev
echo.
echo See PROJECT_SETUP.md for detailed instructions
echo ========================================
echo.

cd ..
pause
