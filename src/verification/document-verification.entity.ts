import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Business } from '../business/registration/business.entity';
import { UploadsEntity } from '../uploads/uploads.entity';

export enum VerificationStatus {
  PENDING = 'PENDING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  NEEDS_REVIEW = 'NEEDS_REVIEW',
}

@Entity('document_verifications')
export class DocumentVerification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  businessId: number;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column({ type: 'int' })
  uploadId: number;

  @ManyToOne(() => UploadsEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uploadId' })
  upload: UploadsEntity;

  @Column({ type: 'varchar', length: 64 })
  documentType: string; // e.g., 'business_registration'

  @Column({ type: 'varchar', length: 255, nullable: true })
  extractedCompanyName: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  extractedRegistrationNumber: string | null;

  @Column({ type: 'date', nullable: true })
  extractedExpiryDate: Date | null;

  @Column({ type: 'tinyint', width: 1, nullable: true })
  matchCompanyName: boolean | null;

  @Column({ type: 'tinyint', width: 1, nullable: true })
  matchRegistrationNumber: boolean | null;

  @Column({ type: 'tinyint', width: 1, nullable: true })
  matchExpiry: boolean | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  confidence: number | null;

  @Column({ type: 'enum', enum: VerificationStatus, default: VerificationStatus.PENDING })
  status: VerificationStatus;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
