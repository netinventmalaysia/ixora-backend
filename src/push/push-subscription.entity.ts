import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('push_subscriptions')
@Index(['userId', 'endpoint'], { unique: true })
@Index(['userId'])
@Index(['endpoint'])
export class PushSubscription {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    userId: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'varchar', length: 500 })
    endpoint: string;

    @Column({ type: 'varchar', length: 255 })
    p256dh: string;

    @Column({ type: 'varchar', length: 255 })
    auth: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    userAgent: string | null;

    @Column({ type: 'timestamp', nullable: true })
    lastSeenAt: Date | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
