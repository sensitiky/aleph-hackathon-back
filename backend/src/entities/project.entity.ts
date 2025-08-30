import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { CreditType } from '../common/enums/credit-type.enum';
import { Transaction } from './transaction.entity';

export enum ProjectStatus {
  DRAFT = 'draft',
  PENDING_VERIFICATION = 'pending_verification',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  projectId: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column({
    type: 'simple-enum',
    enum: CreditType,
  })
  creditType: CreditType;

  @Column()
  country: string;

  @Column()
  region: string;

  @Column()
  methodology: string;

  @Column()
  verificationBody: string;

  @Column({ type: 'integer' })
  vintageYear: number;

  @Column({ nullable: true })
  ipfsHash?: string;

  @Column({
    type: 'simple-enum',
    enum: ProjectStatus,
    default: ProjectStatus.DRAFT,
  })
  status: ProjectStatus;

  @Column({ type: 'decimal', precision: 20, scale: 0, default: 0 })
  totalCreditsIssued: string;

  @Column({ type: 'decimal', precision: 20, scale: 0, default: 0 })
  totalCreditsRetired: string;

  @Column({ nullable: true })
  verifiedAt?: Date;

  @Column({ nullable: true })
  verifiedBy?: string;

  @Column({ nullable: true })
  rejectionReason?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.projects)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  ownerId: string;

  @OneToMany(() => Transaction, (transaction) => transaction.project)
  transactions: Transaction[];
}