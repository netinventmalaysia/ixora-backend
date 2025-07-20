import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('team_members')
export class TeamMember {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    businessId: number;

    @Column({ nullable: true })
    userId: number;

    @Column()
    email: string;

    @Column({ default: 'personal' })
    role: string;

    @Column({ nullable: true })
    invitedBy: number;

    @Column()
    status: string;

    @CreateDateColumn()
    createdAt: Date;
}
