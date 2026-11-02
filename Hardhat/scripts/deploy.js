const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Deploying Voting contract...");

  // Get the contract factory
  const Voting = await hre.ethers.getContractFactory("Voting");
  
  // Deploy the contract
  console.log("⏳ Deploying...");
  const voting = await Voting.deploy();
  
  await voting.waitForDeployment();
  
  const address = await voting.getAddress();
  
  console.log("✅ Voting contract deployed to:", address);
  
  // Save contract address and ABI
  const contractArtifact = await hre.artifacts.readArtifact("Voting");
  
  // Create directories if they don't exist
  const contractsDir = path.join(__dirname, '..', 'Frontend', 'src', 'contracts');
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }
  
  // BigInt serialization replacer function
  const replacer = (key, value) => 
    typeof value === 'bigint' ? value.toString() : value;

  // Save contract address
  fs.writeFileSync(
    path.join(contractsDir, 'contract-address.json'),
    JSON.stringify({ 
      Voting: address,
      network: {
        chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
        name: (await hre.ethers.provider.getNetwork()).name
      }
    }, replacer, 2)
  );
  
  // Save contract ABI
  fs.writeFileSync(
    path.join(contractsDir, 'Voting.json'),
    JSON.stringify(contractArtifact, replacer, 2)
  );
  
  console.log("📄 Contract ABI and address saved to Server and Frontend directories");
  
  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("\n👤 Admin address:", deployer.address);
  console.log("💰 Admin balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");
  
  // Auto-update Server .env file
  const serverEnvPath = path.join(__dirname, '../../Server/.env');
  if (fs.existsSync(serverEnvPath)) {
    let envContent = fs.readFileSync(serverEnvPath, 'utf8');
    
    // Update CONTRACT_ADDRESS
    if (envContent.includes('CONTRACT_ADDRESS=')) {
      envContent = envContent.replace(/CONTRACT_ADDRESS=.*/g, `CONTRACT_ADDRESS=${address}`);
    } else {
      envContent += `\nCONTRACT_ADDRESS=${address}`;
    }
    
    fs.writeFileSync(serverEnvPath, envContent);
    console.log("✅ Auto-updated CONTRACT_ADDRESS in Server/.env");
  }
  
  console.log("\n📝 Contract Address:", address);
  console.log("📝 Admin Address:", deployer.address);
  console.log("\n⚠️  Copy the ADMIN_PRIVATE_KEY from Hardhat node terminal (Account #0)");
  console.log("    and update Server/.env manually");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
