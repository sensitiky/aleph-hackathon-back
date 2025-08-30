import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Project } from './project.entity';

export enum TransactionType {
  MINT = 'mint',
  TRANSFER = 'transfer',
  RETIRE = 'retire',
  APPROVE = 'approve',
  BURN = 'burn',
}

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
}

@Entity('transactions')
@Index(['type', 'status'])
@Index(['createdAt'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  txHash: string;

  @Column({
    type: 'simple-enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({
    type: 'simple-enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column()
  fromAddress: string;

  @Column()
  toAddress: string;

  @Column({ type: 'decimal', precision: 78, scale: 0 })
  amount: string;

  @Column({ nullable: true })
  creditId?: string;

  @Column({ type: 'integer', nullable: true })
  blockNumber?: number;

  @Column({ type: 'decimal', precision: 78, scale: 0, nullable: true })
  gasUsed?: string;

  @Column({ type: 'decimal', precision: 78, scale: 0, nullable: true })
  gasPrice?: string;

  @Column({ type: 'decimal', precision: 78, scale: 0, nullable: true })
  transactionFee?: string;

  @Column({ type: 'text', nullable: true })
  metadata?: string;

  @Column({ nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  confirmedAt?: Date;

  @ManyToOne(() => User, (user) => user.transactions, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ nullable: true })
  userId?: string;

  @ManyToOne(() => Project, (project) => project.transactions, { nullable: true })
  @JoinColumn({ name: 'projectId' })
  project?: Project;

  @Column({ nullable: true })
  projectId?: string;
}