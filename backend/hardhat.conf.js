import pkg from "hardhat";
const { ethers } = pkg;
import fs from 'fs';

async function main() {    
    const contractInfo = JSON.parse(fs.readFileSync('contract-address.json', 'utf8'));
    const CarbonCreditToken = await ethers.getContractFactory("CarbonCreditToken");
    const carbonToken = await CarbonCreditToken.attach(contractInfo.address);

    const testAccounts = [
        {
            name: "Deployer (Admin)",
            address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
            description: "Cuenta principal con todos los roles"
        },
        {
            name: "Usuario de Prueba #1",
            address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
            privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
            description: "Para recibir transferencias"
        },
        {
            name: "Usuario de Prueba #2",
            address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
            privateKey: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
            description: "Para pruebas de trading"
        },
        {
            name: "Usuario de Prueba #3",
            address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
            privateKey: "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
            description: "Para pruebas adicionales"
        }
    ];
    
    for (let i = 0; i < testAccounts.length; i++) {
        const account = testAccounts[i];
        
        try {
            const balance = await carbonToken.balanceOf(account.address);
            const ethBalance = await ethers.provider.getBalance(account.address);
            
            console.log(`${i + 1}. ${account.name}`);
            console.log(`   📍 Dirección: ${account.address}`);
            console.log(`   🔑 Private Key: ${account.privateKey}`);
            console.log(`   💰 CCT Balance: ${balance.toString()} tokens`);
            console.log(`   ⛽ ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);
            console.log(`   📝 ${account.description}`);
            console.log("");
        } catch (error) {
            console.log(`❌ Error verificando cuenta ${account.name}:`, error.message);
        }
    }
    
    testAccounts.forEach((account, i) => {
        if (i > 0) { 
            console.log(`${account.name}: ${account.address}`);
        }
    });
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});