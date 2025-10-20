import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, Unique } from 'typeorm';

@Entity('myskb_project_owners')
@Unique('UQ_myskb_project_owners_project_owner', ['projectId', 'ownerUserId'])
export class MySkbProjectOwner {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column({ type: 'int' })
    projectId: number;

    // Denormalized for easy access/filtering without joining projects
    @Index()
    @Column({ type: 'int' })
    businessId: number;

    @Index()
    @Column({ type: 'int' })
    ownerUserId: number;

    @CreateDateColumn()
    createdAt: Date;
}
