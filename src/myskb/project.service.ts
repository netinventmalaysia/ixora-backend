import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MySkbProject, ProjectStatus } from './project.entity';
import { Business } from '../business/registration/business.entity';
import { MySkbProjectOwner } from './project-owner.entity';

@Injectable()
export class MySkbProjectService {
    constructor(
        @InjectRepository(MySkbProject)
        private readonly repo: Repository<MySkbProject>,
        @InjectRepository(Business)
        private readonly businessRepo: Repository<Business>,
        @InjectRepository(MySkbProjectOwner)
        private readonly ownerRepo: Repository<MySkbProjectOwner>,
    ) { }

    async upsertDraft(
        businessId: number,
        createdBy: number,
        data: Record<string, any>,
        id?: number
    ) {
        // If an id is given, try to update that exact draft first
        if (id) {
            const existing = await this.repo.findOne({
                where: { id, businessId, createdBy, status: ProjectStatus.DRAFT },
            });

            if (existing) {
                existing.data = data;
                return await this.repo.save(existing);
            }
            // fall through to create/reuse a draft if not found
        }

        // Otherwise, reuse the latest draft for this business+user if it exists
        let draft = await this.repo.findOne({
            where: { businessId, createdBy, status: ProjectStatus.DRAFT },
            order: { updatedAt: 'DESC', id: 'DESC' }, // requires UpdateDateColumn
        });

        if (draft) {
            draft.data = data;
        } else {
            draft = this.repo.create({
                businessId,
                createdBy,
                status: ProjectStatus.DRAFT,
                data,
            });
        }

        return await this.repo.save(draft);
    }

    async submit(businessId: number, createdByUserId: number, ownersUserIds: number[], data?: Record<string, any>) {
        let payload = data;

        const submission = this.repo.create({ businessId, createdBy: createdByUserId, status: ProjectStatus.SUBMITTED, data: payload });
        await this.repo.save(submission);
        await this.insertOwnerInformation(submission.id, ownersUserIds);
        return submission;
    }

    async insertOwnerInformation(projectId: number, ownerUserIds: number[]) {
        if (!Array.isArray(ownerUserIds) || !ownerUserIds.length) return;
        const values = ownerUserIds.map((uid) => ({ projectId, ownerUserId: uid }));
        await this.ownerRepo.createQueryBuilder().insert().into(MySkbProjectOwner).values(values).orIgnore().execute();
    }

    async asAsDraft(
        projectId: number | undefined,
        businessId: number,
        createdBy: number,
        data: Record<string, any>,
    ) {
        // If an id is given, try to update that exact draft first
        if (projectId) {
            const existing = await this.repo.findOne({
                where: { id: projectId, businessId, createdBy, status: ProjectStatus.DRAFT },
            });
            if (existing) {
                existing.data = data;
                return await this.repo.save(existing);
            }
        }

        // Otherwise, create a new draft
        const draft = this.repo.create({
            businessId,
            createdBy,
            status: ProjectStatus.DRAFT,
            data,
        });

        return await this.repo.save(draft);
    }

    async listDrafts(userId: number, limit = 20, offset = 0, businessId?: number) {
        const qb = this.repo.createQueryBuilder('p')
            .where('p.createdBy = :userId', { userId })
            .andWhere('p.status = :status', { status: ProjectStatus.DRAFT })
            .orderBy('p.updatedAt', 'DESC')
            .skip(offset)
            .take(limit);
        if (businessId) qb.andWhere('p.businessId = :businessId', { businessId });
        const [rows, total] = await qb.getManyAndCount();
        const data = rows.map((p) => ({
            id: p.id,
            projectTitle: (p as any).data?.projectTitle ?? null,
            created_at: p.createdAt ? p.createdAt.toISOString() : undefined,
            status: 'Draft',
            data: p.data,
            businessId: p.businessId,
            userId: p.createdBy
        }));
        return { data, total, limit, offset };
    }

    async list(viewerUserId: number, limit = 20, offset = 0, businessId?: number) {
        const qb = this.repo.createQueryBuilder('p')
            .leftJoin(MySkbProjectOwner, 'po', 'po.projectId = p.id')
            .where('(p.createdBy = :userId OR po.ownerUserId = :userId)', { userId: viewerUserId })
            .orderBy('p.updatedAt', 'DESC')
            .skip(offset)
            .take(limit);
        const [rows, total] = await qb.getManyAndCount();
        const data = rows.map((p) => ({
            id: p.id,
            projectTitle: (p as any).data?.projectTitle ?? null,
            created_at: p.createdAt ? p.createdAt.toISOString() : undefined,
            status: p.status === ProjectStatus.DRAFT ? 'Draft' : 'Submitted',
            data: p.data,
            businessId: p.businessId,
            userId: p.createdBy,
        }));
        return { data, total, limit, offset };
    }
}
