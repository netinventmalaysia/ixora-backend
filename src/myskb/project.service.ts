import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MySkbProject, ProjectStatus } from './project.entity';
import { Business } from '../business/registration/business.entity';
import { MySkbProjectOwner } from './project-owner.entity';
import { User } from '../users/user.entity';
import { MySkbOwnership, OwnershipStatus } from './ownership.entity';

@Injectable()
export class MySkbProjectService {
    constructor(
        @InjectRepository(MySkbProject)
        private readonly repo: Repository<MySkbProject>,
        @InjectRepository(Business)
        private readonly businessRepo: Repository<Business>,
        @InjectRepository(MySkbProjectOwner)
        private readonly ownerRepo: Repository<MySkbProjectOwner>,
        @InjectRepository(MySkbOwnership)
        private readonly ownershipRepo: Repository<MySkbOwnership>,
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

    async adminGetById(id: number) {
        return this.getByIdWithOwners(id);
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

    async list(viewerUserId: number, limit = 20, offset = 0, businessId?: number, status?: ProjectStatus | string) {
        const qb = this.repo.createQueryBuilder('p');

        const hasBid = businessId && !Number.isNaN(Number(businessId));

        if (hasBid) {
            // Consultant/business owner with approved ownership: list all for the business
            qb.where('p.businessId = :bid', { bid: Number(businessId) });
        } else {
            // Default: only creator or explicit project owner
            qb.leftJoin(MySkbProjectOwner, 'po', 'po.projectId = p.id')
                .where('(p.createdBy = :userId OR po.ownerUserId = :userId)', { userId: viewerUserId });
            if (hasBid) qb.andWhere('p.businessId = :bid', { bid: Number(businessId) });
        }

        qb.orderBy('p.updatedAt', 'DESC').skip(offset).take(limit);
        if (status) {
            const key = String(status).toLowerCase();
            // accept human-friendly values (e.g., 'pending_payment')
            qb.andWhere('LOWER(p.status) = :status', { status: key });
        }
        const [rows, total] = await qb.getManyAndCount();
        const data = rows.map((p) => ({
            id: p.id,
            projectTitle: (p as any).data?.projectTitle ?? null,
            created_at: p.createdAt ? p.createdAt.toISOString() : undefined,
            status: String(p.status),
            data: p.data,
            businessId: p.businessId,
            userId: p.createdBy,
        }));
        return { data, total, limit, offset };
    }

    async getByIdWithOwners(id: number, viewerUserId?: number) {
        const qb = this.repo.createQueryBuilder('p')
            .leftJoin(MySkbProjectOwner, 'po', 'po.projectId = p.id')
            .leftJoin(User, 'u', 'u.id = po.ownerUserId')
            .where('p.id = :id', { id });
        // Optional access check if viewer provided: must be creator or one of owners
        if (viewerUserId) {
            qb.andWhere('(p.createdBy = :viewer OR po.ownerUserId = :viewer)', { viewer: viewerUserId });
        }
        const project = await qb.getOne();
        if (!project) throw new NotFoundException({ message: 'Project not found' });
        // Load business to include friendly name
        const biz = await this.businessRepo.findOne({ where: { id: project.businessId } });
        const businessName = (biz as any)?.name || (biz as any)?.companyName || (biz as any)?.company_name || (biz as any)?.registration_name || undefined;
        // Load owners with names and ownership type if any
        const owners = await this.ownerRepo.createQueryBuilder('po')
            .leftJoin(User, 'u', 'u.id = po.ownerUserId')
            .leftJoin(MySkbOwnership, 'own', 'own.userId = po.ownerUserId AND own.businessId = :bid', { bid: project.businessId })
            .select([
                'po.ownerUserId AS user_id',
                'u.firstName AS firstName',
                'u.lastName AS lastName',
                'u.email AS email',
                'own.role AS ownershipType',
            ])
            .where('po.projectId = :pid', { pid: project.id })
            .getRawMany();
        const ownersFormatted = owners.map((row: any) => ({
            user_id: Number(row.user_id),
            name: [row.firstName, row.lastName].filter(Boolean).join(' ').trim() || undefined,
            email: row.email || undefined,
            ownershipType: row.ownershipType || 'Owner',
        }));
        // Normalize status to display form (Title case)
        const statusRaw = String(project.status || '').toString();
        const statusTitle = statusRaw
            ? statusRaw.charAt(0).toUpperCase() + statusRaw.slice(1).toLowerCase()
            : 'Submitted';
        return {
            id: project.id,
            business_id: project.businessId,
            business: businessName ? { id: project.businessId, name: businessName } : { id: project.businessId },
            status: statusTitle,
            created_at: project.createdAt ? project.createdAt.toISOString() : undefined,
            data: project.data,
            owners: ownersFormatted,
        };
    }

    // ============== Admin operations ==============
    async adminList(status?: ProjectStatus | string, limit = 20, offset = 0) {
        const qb = this.repo.createQueryBuilder('p').orderBy('p.updatedAt', 'DESC').skip(offset).take(limit);
        if (status) {
            // accept case-insensitive string
            const key = String(status).toLowerCase() as keyof typeof ProjectStatus;
            const val = (ProjectStatus as any)[key?.toUpperCase?.() || ''] || status;
            qb.where('p.status = :status', { status: val });
        }
        const [rows, total] = await qb.getManyAndCount();
        const data = rows.map((p) => ({
            id: p.id,
            projectTitle: (p as any).data?.projectTitle ?? null,
            created_at: p.createdAt ? p.createdAt.toISOString() : undefined,
            status: String(p.status),
            data: p.data,
            businessId: p.businessId,
            userId: p.createdBy,
        }));
        return { data, total, limit, offset };
    }

    async review(id: number, reviewerUserId: number, status: 'Approved' | 'Rejected' | 'approved' | 'rejected', reason?: string) {
        const project = await this.repo.findOne({ where: { id } });
        if (!project) throw new NotFoundException('Project not found');
        const lower = String(status).toLowerCase();
        let next: ProjectStatus;
        if (lower === 'approved') next = ProjectStatus.PENDING_PAYMENT; // move to pending payment after admin approval
        else if (lower === 'rejected') next = ProjectStatus.REJECTED;
        else throw new ForbiddenException('Invalid status');

        // Persist review info into data._review
        const now = new Date();
        const data = project.data || {};
        const audit = { reviewerUserId, status: next, reason, at: now.toISOString() };
        project.data = { ...data, _review: audit };
        project.status = next;
        const saved = await this.repo.save(project);
        return {
            id: saved.id,
            status: saved.status,
            reviewed_at: audit.at,
            reviewer_user_id: reviewerUserId,
            reason,
        };
    }
}
