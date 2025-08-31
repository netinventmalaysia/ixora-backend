import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Billing } from './billing.entity';
import { BillingStatus } from './billing-status.enum';

@Entity('billing_items')
export class BillingItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  billingId: number;

  @ManyToOne(() => Billing, (b) => b.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'billingId' })
  billing: Billing;

  // MBMB insert fields per item
  @Column()
  order_no: string;

  // Store in DB as 'item_type' to keep English column name
  @Column({ name: 'item_type', length: 2 })
  jenis: string; // 01,02,04,05

  // Store in DB as 'account_no'
  @Column({ name: 'account_no' })
  no_akaun: string;

  // Store in DB as 'amount'
  @Column({ name: 'amount', type: 'decimal', precision: 12, scale: 2 })
  amaun: number;

  // Track payment state per item as well
  @Column({ type: 'enum', enum: BillingStatus, default: BillingStatus.CREATED })
  status: BillingStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
