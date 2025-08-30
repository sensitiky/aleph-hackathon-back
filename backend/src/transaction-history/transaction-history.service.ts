import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between } from 'typeorm';
import { Transaction, TransactionType, TransactionStatus } from '../entities/transaction.entity';
import { User } from '../entities/user.entity';
import { Project } from '../entities/project.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionQueryDto } from './dto/transaction-query.dto';

@Injectable()
export class TransactionHistoryService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  async createTransaction(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    const {
      txHash,
      type,
      fromAddress,
      toAddress,
      amount,
      creditId,
      blockNumber,
      gasUsed,
      gasPrice,
      metadata,
      userId,
      projectId,
    } = createTransactionDto;

    const transaction = this.transactionRepository.create({
      txHash,
      type,
      fromAddress,
      toAddress,
      amount,
      creditId,
      blockNumber,
      gasUsed,
      gasPrice,
      metadata,
      status: TransactionStatus.PENDING,
    });

    if (userId) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (user) {
        transaction.user = user;
        transaction.userId = userId;
      }
    }

    if (projectId) {
      const project = await this.projectRepository.findOne({ where: { id: projectId } });
      if (project) {
        transaction.project = project;
        transaction.projectId = projectId;
      }
    }

    return this.transactionRepository.save(transaction);
  }

  async updateTransaction(
    txHash: string,
    updateTransactionDto: UpdateTransactionDto,
  ): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { txHash },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with hash ${txHash} not found`);
    }

    Object.assign(transaction, updateTransactionDto);

    if (updateTransactionDto.status === TransactionStatus.CONFIRMED) {
      transaction.confirmedAt = new Date();
    }

    if (updateTransactionDto.gasUsed && updateTransactionDto.gasPrice) {
      transaction.transactionFee = (
        BigInt(updateTransactionDto.gasUsed) * BigInt(updateTransactionDto.gasPrice)
      ).toString();
    }

    return this.transactionRepository.save(transaction);
  }

  async findAll(query: TransactionQueryDto): Promise<{
    transactions: Transaction[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 10,
      type,
      status,
      userId,
      projectId,
      fromDate,
      toDate,
      fromAddress,
      toAddress,
    } = query;

    const where: FindOptionsWhere<Transaction> = {};

    if (type) where.type = type;
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (projectId) where.projectId = projectId;
    if (fromAddress) where.fromAddress = fromAddress;
    if (toAddress) where.toAddress = toAddress;

    if (fromDate || toDate) {
      where.createdAt = Between(
        fromDate ? new Date(fromDate) : new Date('1970-01-01'),
        toDate ? new Date(toDate) : new Date(),
      );
    }

    const [transactions, total] = await this.transactionRepository.findAndCount({
      where,
      relations: ['user', 'project'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      transactions,
      total,
      page,
      limit,
    };
  }

  async findByTxHash(txHash: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { txHash },
      relations: ['user', 'project'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with hash ${txHash} not found`);
    }

    return transaction;
  }

  async findByUser(userId: string, page = 1, limit = 10): Promise<{
    transactions: Transaction[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: { userId },
      relations: ['project'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      transactions,
      total,
      page,
      limit,
    };
  }

  async findByProject(projectId: string, page = 1, limit = 10): Promise<{
    transactions: Transaction[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: { projectId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      transactions,
      total,
      page,
      limit,
    };
  }

  async getTransactionStats(userId?: string): Promise<{
    totalTransactions: number;
    pendingTransactions: number;
    confirmedTransactions: number;
    failedTransactions: number;
    totalVolume: string;
    transactionsByType: { type: TransactionType; count: number }[];
  }> {
    const baseWhere = userId ? { userId } : {};

    const [
      totalTransactions,
      pendingTransactions,
      confirmedTransactions,
      failedTransactions,
    ] = await Promise.all([
      this.transactionRepository.count({ where: baseWhere }),
      this.transactionRepository.count({ 
        where: { ...baseWhere, status: TransactionStatus.PENDING } 
      }),
      this.transactionRepository.count({ 
        where: { ...baseWhere, status: TransactionStatus.CONFIRMED } 
      }),
      this.transactionRepository.count({ 
        where: { ...baseWhere, status: TransactionStatus.FAILED } 
      }),
    ]);

    // Calculate total volume
    const volumeResult = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('SUM(CAST(transaction.amount AS DECIMAL))', 'total')
      .where(userId ? 'transaction.userId = :userId' : '1=1', { userId })
      .andWhere('transaction.status = :status', { status: TransactionStatus.CONFIRMED })
      .getRawOne();

    const totalVolume = volumeResult?.total || '0';

    // Get transactions by type
    const typeStats = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('transaction.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where(userId ? 'transaction.userId = :userId' : '1=1', { userId })
      .groupBy('transaction.type')
      .getRawMany();

    const transactionsByType = typeStats.map(stat => ({
      type: stat.type as TransactionType,
      count: parseInt(stat.count),
    }));

    return {
      totalTransactions,
      pendingTransactions,
      confirmedTransactions,
      failedTransactions,
      totalVolume,
      transactionsByType,
    };
  }

  async deletePendingTransactions(olderThanHours = 24): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - olderThanHours);

    const result = await this.transactionRepository.delete({
      status: TransactionStatus.PENDING,
      createdAt: Between(new Date('1970-01-01'), cutoffDate),
    });

    return result.affected || 0;
  }
}