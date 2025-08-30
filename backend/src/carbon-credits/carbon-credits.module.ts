import { Module } from '@nestjs/common';
import { CarbonCreditsService } from './carbon-credits.service';
import { CarbonCreditsController } from './carbon-credits.controller';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [BlockchainModule],
  controllers: [CarbonCreditsController],
  providers: [CarbonCreditsService],
  exports: [CarbonCreditsService],
})
export class CarbonCreditsModule {}