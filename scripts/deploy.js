import pkg from "hardhat";
const { ethers } = pkg;
import fs from "fs";

async function main() {

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  const CarbonCreditToken = await ethers.getContractFactory("CarbonCreditToken");
  const carbonToken = await CarbonCreditToken.deploy("Carbon Credit Token", "CCT");
  
  await carbonToken.waitForDeployment();
  const contractAddress = await carbonToken.getAddress();
  const contractInfo = {
    address: contractAddress,
    deployer: deployer.address,
    network: "localhost",
    deployedAt: new Date().toISOString()
  };
  
  fs.writeFileSync('contract-address.json', JSON.stringify(contractInfo, null, 2));
  const DEFAULT_ADMIN_ROLE = await carbonToken.DEFAULT_ADMIN_ROLE();
  const hasAdminRole = await carbonToken.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
  
  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error durante el despliegue:");
    console.error(error);
    process.exit(1);
  });