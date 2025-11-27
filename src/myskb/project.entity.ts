import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ReviewStage } from '../review-workflow/review-workflow.entity';

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
@Index(['businessId', 'createdBy', 'status'])
export class MySkbProject {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    businessId: number;

    @Column({ type: 'int' })
    createdBy: number;

    @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.DRAFT })
    status: ProjectStatus;

    @Column({ name: 'currentReviewStage', type: 'enum', enum: ReviewStage, nullable: true })
    currentReviewStage?: ReviewStage | null;

    // Geo coordinates (optional)
    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    latitude?: string | null;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    longitude?: string | null;

    // Store full project form payload
    @Column({ type: 'json' })
    data: any;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
