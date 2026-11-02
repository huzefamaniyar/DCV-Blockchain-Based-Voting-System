# Comprehensive Face Recognition Fix Script
Write-Host "=== Face Recognition Diagnostic & Fix ===" -ForegroundColor Cyan

# Step 1: Kill all node processes to ensure clean restart
Write-Host "`n[1/6] Stopping all Node processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Write-Host "✓ Node processes stopped" -ForegroundColor Green

# Step 2: Clear Vite cache
Write-Host "`n[2/6] Clearing Vite cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force "Frontend\node_modules\.vite" -ErrorAction SilentlyContinue
Write-Host "✓ Vite cache cleared" -ForegroundColor Green

# Step 3: Verify models exist
Write-Host "`n[3/6] Verifying face-api models..." -ForegroundColor Yellow
$modelsPath = "Frontend\public\models"
$requiredModels = @(
    "tiny_face_detector_model-weights_manifest.json",
    "face_landmark_68_model-weights_manifest.json",
    "face_recognition_model-weights_manifest.json",
    "face_expression_model-weights_manifest.json"
)

$allModelsPresent = $true
foreach ($model in $requiredModels) {
    $modelPath = Join-Path $modelsPath $model
    if (Test-Path $modelPath) {
        Write-Host "  ✓ $model" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $model MISSING" -ForegroundColor Red
        $allModelsPresent = $false
    }
}

if (-not $allModelsPresent) {
    Write-Host "`nERROR: Some models are missing. Please download them." -ForegroundColor Red
    exit 1
}

# Step 4: Verify FaceCapture export
Write-Host "`n[4/6] Verifying FaceCapture.jsx export..." -ForegroundColor Yellow
$faceCaptureContent = Get-Content "Frontend\src\components\FaceCapture.jsx" -Raw
if ($faceCaptureContent -match "export default FaceCapture") {
    Write-Host "✓ FaceCapture has default export" -ForegroundColor Green
} else {
    Write-Host "✗ FaceCapture missing default export - FIXING..." -ForegroundColor Red
    Add-Content "Frontend\src\components\FaceCapture.jsx" "`nexport default FaceCapture;"
    Write-Host "✓ Added default export" -ForegroundColor Green
}

# Step 5: Verify config.js
Write-Host "`n[5/6] Verifying config.js..." -ForegroundColor Yellow
$configContent = Get-Content "Frontend\src\config.js" -Raw
if ($configContent -match "modelUrl:\s*['\`"]\/models['\`"]") {
    Write-Host "✓ FACE_API_CONFIG.modelUrl points to /models" -ForegroundColor Green
} else {
    Write-Host "✗ Config has wrong modelUrl" -ForegroundColor Red
}

# Step 6: Instructions for manual restart
Write-Host "`n[6/6] Next steps:" -ForegroundColor Yellow
Write-Host "  1. Open a NEW terminal in Frontend directory" -ForegroundColor White
Write-Host "  2. Run: npm run dev" -ForegroundColor White
Write-Host "  3. Wait for 'Local: http://localhost:5173'" -ForegroundColor White
Write-Host "  4. Hard reload browser (Ctrl+Shift+R)" -ForegroundColor White
Write-Host "  5. Go to /register and test" -ForegroundColor White

Write-Host "`n=== Diagnostic Complete ===" -ForegroundColor Cyan
Write-Host "If face step is still blank after restart, check browser console for errors." -ForegroundColor Yellow
