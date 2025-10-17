import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum ProjectStatus {
    DRAFT = 'draft',
    SUBMITTED = 'submitted',
    APPROVED = 'approved',
    PENDING_PAYMENT = 'pending_payment',
    PAID = 'paid',
    REJECTED = 'rejected',
    EXPIRED = 'expired',
    PENDING_RENEWAL = 'pending_renewal',
    PROJECT_COMPLETED = 'project_completed',
    PROJECT_ONHOLD = 'project_onhold',
    PROJECT_CANCELLED = 'project_cancelled',

}

@Entity('myskb_projects')
@Index(['businessId', 'userId', 'status'])
export class MySkbProject {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    businessId: number;

    @Column({ type: 'int' })
    createdBy: number;

    @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.DRAFT })
    status: ProjectStatus;

    // Store full project form payload
    @Column({ type: 'json' })
    data: any;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
