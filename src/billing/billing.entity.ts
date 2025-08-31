import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Business } from '../business/registration/business.entity';
import { User } from '../users/user.entity';
import { BillingItem } from './billing.item.entity';

export enum BillingStatus {
    CREATED = 'CREATED',
    PAID = 'PAID',
    UNPAID = 'UNPAID',
    SUCCESS = 'SUCCESS', // submitted to MBMB online bill
}

@Entity('billings')
export class Billing {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    reference: string; // IXORA reference grouping items

    @Column()
    businessId: number;

    @ManyToOne(() => Business)
    @JoinColumn({ name: 'businessId' })
    business: Business;

    @Column({ nullable: true })
    userId?: number;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'userId' })
    user?: User;

    @Column({ type: 'enum', enum: BillingStatus, default: BillingStatus.CREATED })
    status: BillingStatus;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    totalAmount: number;

    @Column({ length: 8, default: 'MYR' })
    currency: string;

    // Payment details from Razer callback
    @Column({ type: 'datetime', nullable: true })
    paidAt?: Date | null;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    paidAmount?: number | null;

    @Column({ nullable: true })
    pgTransactionId?: string | null;

    @Column({ nullable: true })
    pgRefNo?: string | null;

    @Column({ nullable: true })
    pgStatus?: string | null;

    @Column({ type: 'datetime', nullable: true })
    mbmbSubmittedAt?: Date | null;

    @OneToMany(() => BillingItem, (item: BillingItem) => item.billing, { cascade: true })
    items: BillingItem[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
