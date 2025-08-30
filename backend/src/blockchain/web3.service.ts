import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Web3 } from 'web3';
import { BlockchainConfigService } from './blockchain-config.service';

@Injectable()
export class Web3Service implements OnModuleInit {
  private readonly logger = new Logger(Web3Service.name);
  private web3: Web3;
  private account: any;

  constructor(private blockchainConfig: BlockchainConfigService) {}

  async onModuleInit() {
    await this.initializeWeb3();
    this.logger.log('Web3 service initialized successfully');
  }

  private async initializeWeb3() {
    try {
      // Initialize Web3 with provider
      this.web3 = new Web3(this.blockchainConfig.nodeUrl);
      
      // Add account from private key
      this.account = this.web3.eth.accounts.privateKeyToAccount(
        this.blockchainConfig.privateKey
      );
      this.web3.eth.accounts.wallet.add(this.account);
      
      // Set default account
      this.web3.eth.defaultAccount = this.account.address;
      
      // Test connection
      const chainId = await this.web3.eth.getChainId();
      const balance = await this.web3.eth.getBalance(this.account.address);
      
      this.logger.log(`Web3 connected to chain ID: ${chainId}`);
      this.logger.log(`Account: ${this.account.address}, Balance: ${this.web3.utils.fromWei(balance, 'ether')} ETH`);
    } catch (error) {
      this.logger.error('Failed to initialize Web3:', error.message);
      throw error;
    }
  }

  // Getters for external access
  getWeb3(): Web3 {
    return this.web3;
  }

  getAccount() {
    return this.account;
  }

  // Utility methods
  toWei(value: string, unit: string = 'ether'): string {
    return this.web3.utils.toWei(value, unit as any);
  }

  fromWei(value: string, unit: string = 'ether'): string {
    return this.web3.utils.fromWei(value, unit as any);
  }

  isAddress(address: string): boolean {
    return this.web3.utils.isAddress(address);
  }

  async getBalance(address: string): Promise<string> {
    const balance = await this.web3.eth.getBalance(address);
    return balance.toString();
  }

  async getGasPrice(): Promise<string> {
    const gasPrice = await this.web3.eth.getGasPrice();
    return gasPrice.toString();
  }

  async estimateGas(transaction: any): Promise<string> {
    const gas = await this.web3.eth.estimateGas(transaction);
    return gas.toString();
  }
}