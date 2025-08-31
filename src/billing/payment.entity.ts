import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderid: string; // reference we used

  @Column({ nullable: true })
  tranID?: string;

  @Column({ nullable: true })
  domain?: string;

  @Column({ nullable: true })
  status?: string;

  @Column({ nullable: true })
  amount?: string;

  @Column({ nullable: true })
  currency?: string;

  @Column({ nullable: true })
  paydate?: string;

  @Column({ nullable: true })
  appcode?: string;

  @Column({ nullable: true })
  error_code?: string;

  @Column({ nullable: true })
  error_desc?: string;

  @Column({ nullable: true })
  channel?: string;

  @Column({ type: 'text', nullable: true })
  extraP?: string; // store as text

  @Column({ nullable: true })
  treq?: string;

  @Column({ nullable: true })
  user_id?: string;

  @Column({ nullable: true })
  vendor_id?: string;

  @Column({ nullable: true })
  vendor_method?: string;

  @Column({ nullable: true })
  callbackPaymentUrl?: string;

  @Column({ nullable: true })
  skey?: string;

  @CreateDateColumn()
  createdAt: Date;
}
