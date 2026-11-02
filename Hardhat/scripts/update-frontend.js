const fs = require('fs');
const path = require('path');

async function updateFrontendConfig(contractAddress, abi) {
  try {
    // Path to frontend contract file
    const frontendContractPath = path.join(__dirname, '../../Frontend/src/contracts/VotingContract.json');
    
    // Create contracts directory if it doesn't exist
    const contractsDir = path.dirname(frontendContractPath);
    if (!fs.existsSync(contractsDir)) {
      fs.mkdirSync(contractsDir, { recursive: true });
    }

    // Create contract JSON with address and ABI
    const contractData = {
      address: contractAddress,
      abi: abi
    };

    // Write to file
    fs.writeFileSync(
      frontendContractPath,
      JSON.stringify(contractData, null, 2)
    );

    console.log('✓ Frontend contract config updated');
    console.log(`  File: ${frontendContractPath}`);
    console.log(`  Address: ${contractAddress}`);

    return true;
  } catch (error) {
    console.error('✗ Failed to update frontend config:', error.message);
    return false;
  }
}

module.exports = { updateFrontendConfig };
