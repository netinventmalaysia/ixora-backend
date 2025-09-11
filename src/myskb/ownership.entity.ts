import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Business } from '../business/registration/business.entity';
import { User } from '../users/user.entity';

export enum OwnershipStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export enum OwnershipScope {
  PROJECT_ONLY = 'project-only',
  FULL = 'full',
}

@Entity('myskb_ownerships')
@Index(['businessId', 'email'], { unique: true })
export class MySkbOwnership {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  businessId: number;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column({ nullable: true })
  userId: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @Column()
  email: string;

  @Column({ nullable: true })
  name: string | null;

  @Column({ nullable: true })
  role: string | null;

  @Column({ nullable: true })
  project: string | null;

  @Column({ nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  lastSeenIso: string | null;

  @Column({ type: 'enum', enum: OwnershipStatus, default: OwnershipStatus.PENDING })
  status: OwnershipStatus;

  @Column({ type: 'enum', enum: OwnershipScope, nullable: true })
  scope: OwnershipScope | null;

  @Column({ type: 'varchar', nullable: true })
  inviteToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  inviteTokenExpires: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
