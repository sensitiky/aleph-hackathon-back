import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BlockchainConfigService {
  constructor(private configService: ConfigService) {}

  get nodeUrl(): string {
    return this.configService.get<string>('ETHEREUM_NODE_URL', 'http://127.0.0.1:8545');
  }

  get privateKey(): string {
    const key = this.configService.get<string>('ETHEREUM_PRIVATE_KEY');
    if (!key) {
      throw new Error('ETHEREUM_PRIVATE_KEY is required');
    }
    return key;
  }

  get contractAddress(): string {
    const address = this.configService.get<string>('CONTRACT_ADDRESS');
    if (!address) {
      throw new Error('CONTRACT_ADDRESS is required');
    }
    return address;
  }

  get chainId(): number {
    return this.configService.get<number>('CHAIN_ID', 31337); // Default: Hardhat local
  }

  get gasPrice(): string {
    return this.configService.get<string>('GAS_PRICE', '20000000000'); // 20 gwei
  }

  get gasLimit(): number {
    return this.configService.get<number>('GAS_LIMIT', 3000000);
  }

  get confirmations(): number {
    return this.configService.get<number>('CONFIRMATIONS', 1);
  }
}