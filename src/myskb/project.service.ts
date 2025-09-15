import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MySkbProject, ProjectStatus } from './project.entity';

@Injectable()
export class MySkbProjectService {
    constructor(
        @InjectRepository(MySkbProject)
        private readonly repo: Repository<MySkbProject>,
    ) { }

    async upsertDraft(businessId: number, userId: number, data: Record<string, any>) {
        // Find existing draft for this user+business
        let draft = await this.repo.findOne({ where: { businessId, userId, status: ProjectStatus.DRAFT } });
        if (!draft) {
            draft = this.repo.create({ businessId, userId, status: ProjectStatus.DRAFT, data });
        } else {
            draft.data = data;
        }
        await this.repo.save(draft);
        return draft;
    }

    async submit(businessId: number, userId: number, data?: Record<string, any>, useDraft = true) {
        let payload = data;
        if (useDraft || !data) {
            const draft = await this.repo.findOne({ where: { businessId, userId, status: ProjectStatus.DRAFT } });
            if (draft) payload = draft.data;
        }
        if (!payload) {
            throw new NotFoundException('No draft found and no data provided');
        }
        const submission = this.repo.create({ businessId, userId, status: ProjectStatus.SUBMITTED, data: payload });
        await this.repo.save(submission);
        return submission;
    }

    async latest(businessId: number, userId: number) {
        const latest = await this.repo.find({ where: { businessId, userId }, order: { updatedAt: 'DESC' }, take: 1 });
        return latest[0] || null;
    }

    async listDrafts(userId: number, limit = 20, offset = 0, businessId?: number) {
        const qb = this.repo.createQueryBuilder('p')
            .where('p.userId = :userId', { userId })
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
            userId: p.userId,
        }));
        return { data, total, limit, offset };
    }

    async list(userId: number, status?: ProjectStatus, limit = 20, offset = 0, businessId?: number) {
        const qb = this.repo.createQueryBuilder('p')
            .where('p.userId = :userId', { userId })
            .orderBy('p.updatedAt', 'DESC')
            .skip(offset)
            .take(limit);
        if (status) qb.andWhere('p.status = :status', { status });
        if (businessId) qb.andWhere('p.businessId = :businessId', { businessId });
        const [rows, total] = await qb.getManyAndCount();
        const data = rows.map((p) => ({
            id: p.id,
            projectTitle: (p as any).data?.projectTitle ?? null,
            created_at: p.createdAt ? p.createdAt.toISOString() : undefined,
            status: p.status === ProjectStatus.DRAFT ? 'Draft' : 'Submitted',
            data: p.data,
            businessId: p.businessId,
            userId: p.userId,
        }));
        return { data, total, limit, offset };
    }
}
