import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vendors')
export class Vendor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  mbmbId: number | null; // ID returned by MBMB

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  role: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  status: string | null;

  @Column({ type: 'varchar', length: 64, name: 'app_name' })
  appName: string;

  @Column({ type: 'varchar', length: 255, name: 'callback_payment_url', nullable: true })
  callbackPaymentUrl: string | null;

  @Column({ type: 'varchar', length: 64, name: 'order_id_prefix', nullable: true })
  orderIdPrefix: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  environment: string | null;

  // We don't store raw keys; optionally store hash if needed in the future
  @Column({ type: 'varchar', length: 255, nullable: true })
  keyHash: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
