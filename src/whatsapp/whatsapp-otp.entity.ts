import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export type OtpPurpose = 'registration' | 'login' | 'reset_password';
export type OtpStatus = 'pending' | 'verified' | 'expired';

@Entity('whatsapp_otps')
@Index(['phone', 'purpose', 'status'])
export class WhatsappOtp {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 32 })
  phone: string; // E.164, e.g. +6017...

  @Column({ type: 'varchar', length: 32, default: 'registration' })
  purpose: OtpPurpose;

  @Column({ type: 'varchar', length: 16 })
  code: string; // typically 6 digits

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status: OtpStatus;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'int', default: 5 })
  maxAttempts: number;

  @Column({ type: 'datetime' })
  expiresAt: Date;

  @Column({ type: 'datetime', nullable: true })
  lastSentAt?: Date | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  messageId?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
