import {
    Entity, Column, PrimaryGeneratedColumn, BeforeInsert,
    BeforeUpdate, CreateDateColumn, UpdateDateColumn
} from 'typeorm';
import * as bcrypt from 'bcrypt';

export enum UserRole {
    GUEST = 'guest',
    PERSONAL = 'personal',
    BUSINESS = 'business',
    CONSULTANT = 'consultant',
    ADMIN = 'admin',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    username: string;

    @Column()
    password: string;

    @Column()
    email: string;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    isActive: boolean;

    @Column()
    isAccountVerified: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ nullable: true })
    lastLogin: Date;

    @Column()
    isEmailVerified: boolean;

    @Column({ type: 'enum', enum: UserRole })
    role: UserRole;

    @Column({ nullable: true })
    profilePicture: string;

    @Column({ nullable: true })
    bio: string;

    @Column({ nullable: true })
    phoneNumber: string;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    city: string;

    @Column({ nullable: true })
    state: string;

    @Column({ nullable: true })
    postalcode: string;

    @Column({ nullable: true })
    country: string;

    @Column({ nullable: true })
    dateOfBirth: Date;

    @Column({ nullable: true })
    preferences: string;

    @Column({ default: false })
    isTwoFactorEnabled: boolean;

    @Column({ type: 'varchar', nullable: true })
    resetToken: string | null;

    @Column({ nullable: true, type: 'timestamp' })
    resetTokenExpiry: Date | null;

    @BeforeInsert()
    @BeforeUpdate()
    async hashPassword() {
        if (
            this.password &&
            !this.password.startsWith('$2a$') &&
            !this.password.startsWith('$2b$')
        ) {
            const saltRounds = 10;
            this.password = await bcrypt.hash(this.password, saltRounds);
        }
    }
}
