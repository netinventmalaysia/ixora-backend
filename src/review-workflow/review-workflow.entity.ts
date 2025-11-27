import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    ManyToOne,
    JoinColumn,
    Unique,
    Index,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum ReviewStage {
    LEVEL1 = 'level1',
    LEVEL2 = 'level2',
    FINAL = 'final',
}

@Entity('review_workflow_stages')
@Unique(['module', 'stage'])
export class ReviewWorkflowStage {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 64 })
    @Index()
    module: string;

    @Column({ type: 'enum', enum: ReviewStage })
    stage: ReviewStage;

    @Column({ type: 'int', name: 'order_index', default: 0 })
    orderIndex: number;

    @Column({ type: 'boolean', default: true })
    enabled: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => ReviewWorkflowStageMember, (member) => member.stage, { cascade: ['remove'] })
    members: ReviewWorkflowStageMember[];
}

@Entity('review_workflow_stage_members')
@Unique(['stageId', 'userId'])
export class ReviewWorkflowStageMember {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'stage_id' })
    stageId: number;

    @ManyToOne(() => ReviewWorkflowStage, (stage) => stage.members, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'stage_id' })
    stage: ReviewWorkflowStage;

    @Column({ name: 'user_id' })
    userId: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'user_email', type: 'varchar', length: 255 })
    userEmail: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
