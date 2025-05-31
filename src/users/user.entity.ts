import {
    Entity, Column, PrimaryGeneratedColumn, BeforeInsert,
    BeforeUpdate,
} from 'typeorm';

import * as bcrypt from 'bcrypt';

import { ApiProperty } from '@nestjs/swagger';

@Entity('users')
export class User {
    @ApiProperty()
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty()
    @Column()

    username: string;

    @ApiProperty()
    @Column()

    password: string;

    @ApiProperty()
    @Column()

    email: string;

    @ApiProperty()
    @Column()

    firstName: string;

    @ApiProperty()
    @Column()

    lastName: string;

    @ApiProperty()
    @Column()

    isActive: boolean;

    @ApiProperty()
    @Column()

    createdAt: Date;

    @Column()
    updatedAt: Date;

    @ApiProperty()
    @Column({ nullable: true })

    lastLogin: Date;

    @ApiProperty()
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
