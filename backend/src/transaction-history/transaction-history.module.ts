import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionHistoryService } from './transaction-history.service';
import { TransactionHistoryController } from './transaction-history.controller';
import { Transaction } from '../entities/transaction.entity';
import { User } from '../entities/user.entity';
import { Project } from '../entities/project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, User, Project])],
  providers: [TransactionHistoryService],
  controllers: [TransactionHistoryController],
  exports: [TransactionHistoryService],
})
export class TransactionHistoryModule {}