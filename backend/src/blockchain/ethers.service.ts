import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ethers } from 'ethers';
import { BlockchainConfigService } from './blockchain-config.service';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class EthersService implements OnModuleInit {
  private readonly logger = new Logger(EthersService.name);
  private provider: ethers.Provider;
  private signer: ethers.Wallet;
  private contract: ethers.Contract;

  // ABI del contrato CarbonCreditToken (versión simplificada)
  private readonly contractABI = [
    // Read functions
    'function balanceOf(address owner) view returns (uint256)',
    'function totalSupply() view returns (uint256)',
    'function totalRetiredCredits() view returns (uint256)',
    'function getUserCredits(address user) view returns (uint256[])',
    'function getCreditMetadata(uint256 creditId) view returns (tuple(string projectId, string projectName, uint8 creditType, uint256 vintageYear, string methodology, string country, string region, uint256 issuanceDate, string verificationBody, string ipfsHash, bool isRetired, address retiredBy, uint256 retiredAt))',
    'function getStats() view returns (uint256 totalSupply, uint256 totalCredits, uint256 totalRetired, uint256 activeCredits)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function verifiedProjects(string projectId) view returns (bool)',

    // Write functions
    'function transfer(address to, uint256 amount) returns (bool)',
    'function transferFrom(address from, address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function verifyProject(string projectId)',
    'function mintCredit(address to, uint256 amount, tuple(string projectId, string projectName, uint8 creditType, uint256 vintageYear, string methodology, string country, string region, uint256 issuanceDate, string verificationBody, string ipfsHash, bool isRetired, address retiredBy, uint256 retiredAt) metadata) returns (uint256)',
    'function retireCredit(uint256 creditId, uint256 amount, string reason)',

    // Events
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)',
    'event CreditMinted(uint256 indexed creditId, address indexed to, uint256 amount, string projectId, uint8 creditType)',
    'event CreditRetired(uint256 indexed creditId, address indexed by, uint256 amount, string reason)',
    'event ProjectVerified(string indexed projectId, address indexed verifier)',
  ];

  constructor(private blockchainConfig: BlockchainConfigService) {}

  async onModuleInit() {
    await this.initializeProvider();
    await this.initializeSigner();
    await this.initializeContract();
    this.logger.log('Ethers service initialized successfully');
  }

  private async initializeProvider() {
    try {
      this.provider = new ethers.JsonRpcProvider(this.blockchainConfig.nodeUrl);

      // Test connection
      const network = await this.provider.getNetwork();
      this.logger.log(
        `Connected to network: ${network.name} (chainId: ${network.chainId})`
      );
    } catch (error) {
      this.logger.error('Failed to initialize provider:', error.message);
      throw error;
    }
  }

  private async initializeSigner() {
    try {
      this.signer = new ethers.Wallet(
        this.blockchainConfig.privateKey,
        this.provider
      );

      // Test signer
      const address = await this.signer.getAddress();
      const balance = await this.provider.getBalance(address);
      this.logger.log(
        `Signer address: ${address}, Balance: ${ethers.formatEther(balance)} ETH`
      );
    } catch (error) {
      this.logger.error('Failed to initialize signer:', error.message);
      throw error;
    }
  }

  private async initializeContract() {
    const artifactPath = path.resolve(
      __dirname,
      '../../../artifacts/contracts/CarbonCreditToken.sol/CarbonCreditToken.json'
    );
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

    const contractInfoPath = path.resolve(
      __dirname,
      '../../../scripts/contract-address.json'
    );
    const parsedContractInfo = JSON.parse(
      fs.readFileSync(contractInfoPath, 'utf8')
    );
    this.provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_NODE_URL);
    this.signer = new ethers.Wallet(
      process.env.ETHEREUM_PRIVATE_KEY,
      this.provider
    );

    this.contract = new ethers.Contract(
      parsedContractInfo.address,
      artifact.abi,
      this.signer
    );

    const code = await this.provider.getCode(parsedContractInfo.address);
    if (code === '0x') {
      throw new Error(`No contract deployed at ${this.contract.address}`);
    }

    if ('totalSupply' in this.contract) {
      try {
        const totalSupply = await this.contract.totalSupply();
        this.logger.log(
          `Contract connected. Total supply: ${totalSupply.toString()}`
        );
      } catch {
        this.logger.warn(
          'Contract connected but totalSupply() failed. ABI mismatch?'
        );
      }
    }
  }

  // Getters for external access
  getProvider(): ethers.Provider {
    return this.provider;
  }

  getSigner(): ethers.Wallet {
    return this.signer;
  }

  getContract(): ethers.Contract {
    return this.contract;
  }

  // Utility methods
  async getBalance(address: string): Promise<bigint> {
    return await this.contract.balanceOf(address);
  }

  async getTotalSupply(): Promise<bigint> {
    return await this.contract.totalSupply();
  }

  async waitForTransaction(txHash: string): Promise<ethers.TransactionReceipt> {
    return await this.provider.waitForTransaction(
      txHash,
      this.blockchainConfig.confirmations
    );
  }

  formatEther(value: bigint): string {
    return ethers.formatEther(value);
  }

  parseEther(value: string): bigint {
    return ethers.parseEther(value);
  }

  isAddress(address: string): boolean {
    return ethers.isAddress(address);
  }
}
