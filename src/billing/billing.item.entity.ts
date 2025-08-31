import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Billing, BillingStatus } from './billing.entity';

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

  @Column({ length: 2 })
  jenis: string; // 01,02,04,05

  @Column()
  no_akaun: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amaun: number;

  // Track payment state per item as well
  @Column({ type: 'enum', enum: BillingStatus, default: BillingStatus.CREATED })
  status: BillingStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
