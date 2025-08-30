import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockchainConfigService } from './blockchain-config.service';
import { Web3Service } from './web3.service';
import { EthersService } from './ethers.service';
import { BlockchainEventsService } from './blockchain-events.service';
import { TransactionHistoryModule } from '../transaction-history/transaction-history.module';
import { User } from '../entities/user.entity';
import { Project } from '../entities/project.entity';

@Global()
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, Project]),
    TransactionHistoryModule,
  ],
  providers: [
    BlockchainConfigService,
    Web3Service,
    EthersService,
    BlockchainEventsService,
  ],
  exports: [
    BlockchainConfigService,
    Web3Service,
    EthersService,
    BlockchainEventsService,
  ],
})
export class BlockchainModule {}