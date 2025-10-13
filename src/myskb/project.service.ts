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

    async upsertDraft(businessId: number, userId: number, data: Record<string, any>) {
        // Find existing draft for this user+business
        let draft = await this.repo.findOne({ where: { businessId, userId, status: ProjectStatus.DRAFT } });
        if (!draft) {
            // Resolve ownerId from Business
            const biz = await this.businessRepo.findOne({ where: { id: businessId } });
            const ownerId = biz?.userId ?? null;
            draft = this.repo.create({ businessId, userId, ownerId, status: ProjectStatus.DRAFT, data });
        } else {
            draft.data = data;
            // Keep ownerId in sync if missing
            if (!draft.ownerId) {
                const biz = await this.businessRepo.findOne({ where: { id: businessId } });
                draft.ownerId = biz?.userId ?? null;
            }
        }
        await this.repo.save(draft);
        // Ensure join table has the owner mapping
        if (draft.ownerId) {
            await this.ownerRepo
                .createQueryBuilder()
                .insert()
                .into(MySkbProjectOwner)
                .values({ projectId: draft.id, ownerUserId: draft.ownerId })
                .orIgnore()
                .execute();
        }
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
        const biz = await this.businessRepo.findOne({ where: { id: businessId } });
        const ownerId = biz?.userId ?? null;
        const submission = this.repo.create({ businessId, userId, ownerId, status: ProjectStatus.SUBMITTED, data: payload });
        await this.repo.save(submission);
        if (ownerId) {
            await this.ownerRepo
                .createQueryBuilder()
                .insert()
                .into(MySkbProjectOwner)
                .values({ projectId: submission.id, ownerUserId: ownerId })
                .orIgnore()
                .execute();
        }
        return submission;
    }

    async updateDraftById(id: number, businessId: number, userId: number, data: Record<string, any>) {
        const draft = await this.repo.findOne({ where: { id, businessId, userId } });
        if (!draft) throw new NotFoundException('Draft not found');
        if (draft.status !== ProjectStatus.DRAFT) return draft; // idempotent for submitted
        draft.data = data;
        if (!draft.ownerId) {
            const biz = await this.businessRepo.findOne({ where: { id: businessId } });
            draft.ownerId = biz?.userId ?? null;
        }
        await this.repo.save(draft);
        if (draft.ownerId) {
            await this.ownerRepo
                .createQueryBuilder()
                .insert()
                .into(MySkbProjectOwner)
                .values({ projectId: draft.id, ownerUserId: draft.ownerId })
                .orIgnore()
                .execute();
        }
        return draft;
    }

    async submitDraftById(id: number, businessId: number, userId: number, data?: Record<string, any>) {
        const draft = await this.repo.findOne({ where: { id, businessId, userId } });
        if (!draft) throw new NotFoundException('Draft not found');
        if (data) draft.data = data;
        if (draft.status === ProjectStatus.SUBMITTED) {
            return draft; // idempotent
        }
        draft.status = ProjectStatus.SUBMITTED;
        if (!draft.ownerId) {
            const biz = await this.businessRepo.findOne({ where: { id: businessId } });
            draft.ownerId = biz?.userId ?? null;
        }
        await this.repo.save(draft);
        if (draft.ownerId) {
            await this.ownerRepo
                .createQueryBuilder()
                .insert()
                .into(MySkbProjectOwner)
                .values({ projectId: draft.id, ownerUserId: draft.ownerId })
                .orIgnore()
                .execute();
        }
        return draft;
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
            ownerId: p.ownerId ?? null,
        }));
        return { data, total, limit, offset };
    }

    async list(userId: number, status?: ProjectStatus, limit = 20, offset = 0, businessId?: number) {
        const qb = this.repo.createQueryBuilder('p')
            // A user can see submissions they created OR those where they are an owner via join table
            .leftJoin(MySkbProjectOwner, 'po', 'po.projectId = p.id')
            .where('(p.userId = :userId OR po.ownerUserId = :userId)', { userId })
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
            ownerId: p.ownerId ?? null,
        }));
        return { data, total, limit, offset };
    }
}
