import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('businesses')
export class Business {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    companyName: string;

    @Column()
    registrationNumber: string;

    @Column({ type: 'date' })
    expiryDate: Date;

    @Column()
    certificateFilePath: string;

    @Column()
    phone: string;

    @Column()
    address: string;

    @Column()
    city: string;

    @Column()
    state: string;

    @Column()
    postalcode: string;

    @Column()
    country: string;

    @Column()
    accountType: string; // 'business' or 'organisation'

    @Column({ default: 'Submitted' })
    status: string;

    @Column()
    invitationToken: string;

    @Column({ type: 'timestamp', nullable: true })
    invitationTokenExpires: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
