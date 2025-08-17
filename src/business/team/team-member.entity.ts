import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Business } from '../registration/business.entity';
import { User } from 'src/users/user.entity';

export enum TeamMemberStatus {
    PENDING = 'pending',
    ACTIVE = 'active',
    DECLINED = 'declined',
}

@Entity('team_members')
export class TeamMember {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    businessId: number;

    @ManyToOne(() => Business)
    @JoinColumn({ name: 'businessId' })
    business: Business;

    @Column({ nullable: true })
    userId: number;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    email: string;

    @Column({ default: 'personal' })
    role: string;

    @Column({ nullable: true })
    invitedBy: number;

    @Column({ type: 'enum', enum: TeamMemberStatus, default: TeamMemberStatus.PENDING })
    status: TeamMemberStatus;

    @Column({ nullable: true })
    token: string;

    @Column({ type: 'timestamp', nullable: true })
    tokenExpires: Date;

    @CreateDateColumn()
    createdAt: Date;
}