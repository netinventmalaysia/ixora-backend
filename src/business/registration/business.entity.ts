import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('businesses')
export class Business {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

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

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
