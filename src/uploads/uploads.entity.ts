import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Business } from '../business/registration/business.entity';
import { User } from '../users/user.entity';

@Entity('uploads')
export class UploadsEntity {
    @PrimaryGeneratedColumn()
    id: number;

    // Storage backend
    @Column({ default: 'sftp' })
    storage: string; // 'sftp' | 'local' | 's3' etc.

    // File identity
    @Column()
    originalName: string;

    @Column()
    filename: string;

    @Column({ length: 512 })
    path: string; // relative remote path, e.g. `${folder}/${filename}`

        @Column({ nullable: true })
        folder: string | null;

    // File meta
        @Column({ nullable: true })
        mimeType: string | null;

    @Column({ type: 'int', default: 0 })
    size: number; // bytes

    // Business/doc context
        @Column({ nullable: true })
        documentType: string | null; // e.g. 'business_registration', 'ic_copy'

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ nullable: true })
    businessId: number | null;

    @ManyToOne(() => Business, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'businessId' })
    business?: Business | null;

    @Column({ nullable: true })
    userId: number | null; // uploaded by

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'userId' })
    user?: User | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
