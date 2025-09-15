import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum ProjectStatus {
    DRAFT = 'draft',
    SUBMITTED = 'submitted',
}

@Entity('myskb_projects')
@Index(['businessId', 'userId', 'status'])
export class MySkbProject {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    businessId: number;

    @Column({ type: 'int' })
    userId: number;

    @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.DRAFT })
    status: ProjectStatus;

    // Store full project form payload
    @Column({ type: 'json' })
    data: any;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
