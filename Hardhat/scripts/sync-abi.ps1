param()
$ErrorActionPreference = 'Stop'

# Paths
$root = Split-Path -Parent $PSScriptRoot
$deployPath = Join-Path $root 'deploy_output.txt'
$artifactPath = Join-Path $root 'artifacts\contracts\Voting.sol\Voting.json'
$serverEnv = Join-Path $root '..\Server\.env'
$serverAbiDir = Join-Path $root '..\Server\contracts'
$serverAbiFile = Join-Path $serverAbiDir 'VotingSystem.json'

# Frontend targets
$frontendEnv = Join-Path $root '..\Frontend\.env'
$frontendWeb3Dir = Join-Path $root '..\Frontend\src\web3'
$frontendAbiFile = Join-Path $frontendWeb3Dir 'Voting.json'

if (!(Test-Path $deployPath)) { throw "deploy_output.txt not found at $deployPath" }
if (!(Test-Path $artifactPath)) { throw "Hardhat artifact not found at $artifactPath" }

# Extract address from labeled lines; fallback to first 0x address
$contractAddress = $null
$lines = Get-Content $deployPath
$labelLine = $lines | Where-Object { $_ -match 'Contract Address|deployed to' } | Select-Object -First 1
if ($labelLine -and ($labelLine -match '0x[0-9a-fA-F]{40}')) { $contractAddress = $Matches[0] }
if (-not $contractAddress) {
  $all = Select-String -Path $deployPath -Pattern '0x[0-9a-fA-F]{40}' -AllMatches | ForEach-Object { $_.Matches.Value }
  if ($all -and $all.Count -ge 1) { $contractAddress = $all[0] }
}
if (-not $contractAddress) { throw 'Failed to extract contract address from deploy_output.txt' }

Write-Host "Using Contract Address: $contractAddress"

# Update Server/.env CONTRACT_ADDRESS
if (!(Test-Path $serverEnv)) { throw "Server/.env not found at $serverEnv" }
$content = Get-Content $serverEnv -Raw
if ($content -match 'CONTRACT_ADDRESS=') { $content = ($content -replace 'CONTRACT_ADDRESS=.*', "CONTRACT_ADDRESS=$contractAddress") }
else { $content += "`nCONTRACT_ADDRESS=$contractAddress" }
Set-Content -Path $serverEnv -Value $content
Write-Host "Updated Server/.env CONTRACT_ADDRESS"

# Update Frontend/.env VITE_VOTING_ADDRESS (create file if missing)
if (!(Test-Path $frontendEnv)) { New-Item -ItemType File -Path $frontendEnv -Force | Out-Null }
$fcontent = Get-Content $frontendEnv -Raw
if ($fcontent -match 'VITE_VOTING_ADDRESS=') { $fcontent = ($fcontent -replace 'VITE_VOTING_ADDRESS=.*', "VITE_VOTING_ADDRESS=$contractAddress") }
else { $fcontent += "`nVITE_VOTING_ADDRESS=$contractAddress" }
Set-Content -Path $frontendEnv -Value $fcontent
Write-Host "Updated Frontend/.env VITE_VOTING_ADDRESS"

# Write Server/contracts/VotingSystem.json with address + abi
$artifact = Get-Content $artifactPath -Raw | ConvertFrom-Json
$new = [ordered]@{ address = $contractAddress; abi = $artifact.abi }
$json = $new | ConvertTo-Json -Depth 100
New-Item -ItemType Directory -Force -Path $serverAbiDir | Out-Null
Set-Content -Path $serverAbiFile -Value $json
Write-Host "Wrote $serverAbiFile"

# Also write Frontend ABI/address bundle
New-Item -ItemType Directory -Force -Path $frontendWeb3Dir | Out-Null
Set-Content -Path $frontendAbiFile -Value $json
Write-Host "Wrote $frontendAbiFile"
