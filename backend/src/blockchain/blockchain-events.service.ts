import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ethers } from 'ethers';
import { EthersService } from './ethers.service';
import { TransactionHistoryService } from '../transaction-history/transaction-history.service';
import { Transaction, TransactionType, TransactionStatus } from '../entities/transaction.entity';
import { User } from '../entities/user.entity';
import { Project } from '../entities/project.entity';

interface CreditMintedEvent {
  creditId: bigint;
  to: string;
  amount: bigint;
  projectId: string;
  creditType: number;
}

interface TransferEvent {
  from: string;
  to: string;
  value: bigint;
}

interface CreditRetiredEvent {
  creditId: bigint;
  retiredBy: string;
  amount: bigint;
}

@Injectable()
export class BlockchainEventsService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainEventsService.name);
  private contract: ethers.Contract;
  private isListening = false;

  constructor(
    private ethersService: EthersService,
    private transactionHistoryService: TransactionHistoryService,
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  async onModuleInit() {
    try {
      await this.initializeContract();
      await this.startListening();
    } catch (error) {
      this.logger.error('Failed to initialize blockchain event listeners:', error);
    }
  }

  private async initializeContract() {
    this.contract = this.ethersService.getContract();
    this.logger.log('Blockchain events service initialized');
  }

  async startListening() {
    if (this.isListening) {
      this.logger.warn('Event listeners are already running');
      return;
    }

    this.logger.log('Starting blockchain event listeners...');

    // Listen for CreditMinted events
    this.contract.on('CreditMinted', async (creditId, to, amount, projectId, creditType, event) => {
      await this.handleCreditMintedEvent({
        creditId,
        to,
        amount,
        projectId,
        creditType,
      }, event);
    });

    // Listen for Transfer events (ERC20)
    this.contract.on('Transfer', async (from, to, value, event) => {
      await this.handleTransferEvent({
        from,
        to,
        value,
      }, event);
    });

    // Listen for CreditRetired events
    this.contract.on('CreditRetired', async (creditId, retiredBy, amount, event) => {
      await this.handleCreditRetiredEvent({
        creditId,
        retiredBy,
        amount,
      }, event);
    });

    // Listen for Approval events
    this.contract.on('Approval', async (owner, spender, value, event) => {
      await this.handleApprovalEvent({
        owner,
        spender,
        value,
      }, event);
    });

    // Listen for ProjectVerified events
    this.contract.on('ProjectVerified', async (projectId, event) => {
      await this.handleProjectVerifiedEvent(projectId, event);
    });

    this.isListening = true;
    this.logger.log('Blockchain event listeners started successfully');
  }

  async stopListening() {
    if (!this.isListening) {
      this.logger.warn('Event listeners are not running');
      return;
    }

    this.contract.removeAllListeners();
    this.isListening = false;
    this.logger.log('Blockchain event listeners stopped');
  }

  private async handleCreditMintedEvent(
    eventData: CreditMintedEvent,
    event: ethers.Log,
  ) {
    try {
      this.logger.log(`Credit minted: ID ${eventData.creditId}, Amount: ${eventData.amount}, To: ${eventData.to}`);

      // Find user by wallet address
      const user = await this.userRepository.findOne({
        where: { walletAddress: eventData.to },
      });

      // Find project
      const project = await this.projectRepository.findOne({
        where: { projectId: eventData.projectId },
      });

      // Create transaction record
      await this.transactionHistoryService.createTransaction({
        txHash: event.transactionHash,
        type: TransactionType.MINT,
        fromAddress: ethers.ZeroAddress,
        toAddress: eventData.to,
        amount: eventData.amount.toString(),
        creditId: eventData.creditId.toString(),
        blockNumber: event.blockNumber,
        gasUsed: '0', // Will be updated when transaction receipt is processed
        gasPrice: '0',
        metadata: JSON.stringify({
          projectId: eventData.projectId,
          creditType: eventData.creditType,
        }),
        userId: user?.id,
        projectId: project?.id,
      });

      this.logger.log(`Transaction record created for credit mint: ${event.transactionHash}`);
    } catch (error) {
      this.logger.error('Error handling CreditMinted event:', error);
    }
  }

  private async handleTransferEvent(
    eventData: TransferEvent,
    event: ethers.Log,
  ) {
    try {
      // Skip zero transfers and mint/burn events (already handled elsewhere)
      if (eventData.value === 0n || 
          eventData.from === ethers.ZeroAddress || 
          eventData.to === ethers.ZeroAddress) {
        return;
      }

      this.logger.log(`Transfer: From ${eventData.from}, To: ${eventData.to}, Amount: ${eventData.value}`);

      // Find users by wallet addresses
      const [fromUser, toUser] = await Promise.all([
        this.userRepository.findOne({ where: { walletAddress: eventData.from } }),
        this.userRepository.findOne({ where: { walletAddress: eventData.to } }),
      ]);

      // Create transaction record
      await this.transactionHistoryService.createTransaction({
        txHash: event.transactionHash,
        type: TransactionType.TRANSFER,
        fromAddress: eventData.from,
        toAddress: eventData.to,
        amount: eventData.value.toString(),
        blockNumber: event.blockNumber,
        gasUsed: '0',
        gasPrice: '0',
        userId: fromUser?.id || toUser?.id, // Prefer sender, fallback to receiver
      });

      this.logger.log(`Transaction record created for transfer: ${event.transactionHash}`);
    } catch (error) {
      this.logger.error('Error handling Transfer event:', error);
    }
  }

  private async handleCreditRetiredEvent(
    eventData: CreditRetiredEvent,
    event: ethers.Log,
  ) {
    try {
      this.logger.log(`Credit retired: ID ${eventData.creditId}, Amount: ${eventData.amount}, By: ${eventData.retiredBy}`);

      // Find user by wallet address
      const user = await this.userRepository.findOne({
        where: { walletAddress: eventData.retiredBy },
      });

      // Create transaction record
      await this.transactionHistoryService.createTransaction({
        txHash: event.transactionHash,
        type: TransactionType.RETIRE,
        fromAddress: eventData.retiredBy,
        toAddress: ethers.ZeroAddress,
        amount: eventData.amount.toString(),
        creditId: eventData.creditId.toString(),
        blockNumber: event.blockNumber,
        gasUsed: '0',
        gasPrice: '0',
        metadata: JSON.stringify({
          creditId: eventData.creditId.toString(),
        }),
        userId: user?.id,
      });

      this.logger.log(`Transaction record created for credit retirement: ${event.transactionHash}`);
    } catch (error) {
      this.logger.error('Error handling CreditRetired event:', error);
    }
  }

  private async handleApprovalEvent(
    eventData: { owner: string; spender: string; value: bigint },
    event: ethers.Log,
  ) {
    try {
      this.logger.log(`Approval: Owner ${eventData.owner}, Spender: ${eventData.spender}, Amount: ${eventData.value}`);

      // Find user by wallet address
      const user = await this.userRepository.findOne({
        where: { walletAddress: eventData.owner },
      });

      // Create transaction record
      await this.transactionHistoryService.createTransaction({
        txHash: event.transactionHash,
        type: TransactionType.APPROVE,
        fromAddress: eventData.owner,
        toAddress: eventData.spender,
        amount: eventData.value.toString(),
        blockNumber: event.blockNumber,
        gasUsed: '0',
        gasPrice: '0',
        userId: user?.id,
      });

      this.logger.log(`Transaction record created for approval: ${event.transactionHash}`);
    } catch (error) {
      this.logger.error('Error handling Approval event:', error);
    }
  }

  private async handleProjectVerifiedEvent(
    projectId: string,
    event: ethers.Log,
  ) {
    try {
      this.logger.log(`Project verified: ${projectId}`);

      // Update project status in database
      const project = await this.projectRepository.findOne({
        where: { projectId },
      });

      if (project) {
        project.status = 'verified' as any;
        project.verifiedAt = new Date();
        await this.projectRepository.save(project);
        this.logger.log(`Project ${projectId} status updated to verified`);
      }
    } catch (error) {
      this.logger.error('Error handling ProjectVerified event:', error);
    }
  }

  // Method to process past events (useful for initial sync)
  async syncPastEvents(fromBlock: number = 0) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    this.logger.log(`Syncing past events from block ${fromBlock}...`);

    try {
      const currentBlock = await this.ethersService.getProvider().getBlockNumber();
      const chunkSize = 1000; // Process in chunks to avoid RPC limits

      for (let start = fromBlock; start <= currentBlock; start += chunkSize) {
        const end = Math.min(start + chunkSize - 1, currentBlock);
        
        this.logger.log(`Processing blocks ${start} to ${end}`);

        // Get all events for this chunk
        const filter = this.contract.filters;
        const events = await Promise.all([
          this.contract.queryFilter(filter.CreditMinted(), start, end),
          this.contract.queryFilter(filter.Transfer(), start, end),
          this.contract.queryFilter(filter.CreditRetired(), start, end),
          this.contract.queryFilter(filter.Approval(), start, end),
          this.contract.queryFilter(filter.ProjectVerified(), start, end),
        ]);

        // Process events
        for (const eventGroup of events) {
          for (const event of eventGroup) {
            await this.processHistoricalEvent(event);
          }
        }
      }

      this.logger.log(`Past events sync completed up to block ${currentBlock}`);
    } catch (error) {
      this.logger.error('Error syncing past events:', error);
      throw error;
    }
  }

  private async processHistoricalEvent(event: ethers.Log) {
    try {
      const parsedEvent = this.contract.interface.parseLog({
        topics: event.topics as string[],
        data: event.data,
      });

      if (!parsedEvent) return;

      switch (parsedEvent.name) {
        case 'CreditMinted':
          await this.handleCreditMintedEvent({
            creditId: parsedEvent.args.creditId,
            to: parsedEvent.args.to,
            amount: parsedEvent.args.amount,
            projectId: parsedEvent.args.projectId,
            creditType: parsedEvent.args.creditType,
          }, event);
          break;

        case 'Transfer':
          await this.handleTransferEvent({
            from: parsedEvent.args.from,
            to: parsedEvent.args.to,
            value: parsedEvent.args.value,
          }, event);
          break;

        case 'CreditRetired':
          await this.handleCreditRetiredEvent({
            creditId: parsedEvent.args.creditId,
            retiredBy: parsedEvent.args.retiredBy,
            amount: parsedEvent.args.amount,
          }, event);
          break;

        case 'Approval':
          await this.handleApprovalEvent({
            owner: parsedEvent.args.owner,
            spender: parsedEvent.args.spender,
            value: parsedEvent.args.value,
          }, event);
          break;

        case 'ProjectVerified':
          await this.handleProjectVerifiedEvent(parsedEvent.args.projectId, event);
          break;
      }
    } catch (error) {
      this.logger.error('Error processing historical event:', error);
    }
  }

  getListeningStatus(): boolean {
    return this.isListening;
  }
}