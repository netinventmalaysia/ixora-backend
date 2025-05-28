import {
    Entity, Column, PrimaryGeneratedColumn, BeforeInsert,
    BeforeUpdate,
} from 'typeorm';

import * as bcrypt from 'bcrypt';

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
    createdAt: Date;

    @Column()
    updatedAt: Date;

    @Column({ nullable: true })
    lastLogin: Date;

    @Column()
    isEmailVerified: boolean;

    @Column()
    role: 'admin' | 'user' | 'superadmin';

    @Column({ nullable: true })
    profilePicture: string;

    @Column({ nullable: true })
    bio: string;

    @Column({ nullable: true })
    phoneNumber: string;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    dateOfBirth: Date;

    @Column({ nullable: true })
    preferences: string; // JSON string for user preferences

    @Column({ default: false })
    isTwoFactorEnabled: boolean;

    @Column({ default: false })
    staffId: string;

    @BeforeInsert()
    @BeforeUpdate()
    async hashPassword() {
        if (this.password) {
            const saltRounds = 10;
            this.password = await bcrypt.hash(this.password, saltRounds);
        }
    }

}
