import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MySkbProject, ProjectStatus } from './project.entity';
import { Business } from '../business/registration/business.entity';
import { MySkbProjectOwner } from './project-owner.entity';
import { User, UserRole } from '../users/user.entity';
import { MySkbOwnership } from './ownership.entity';
import { ReviewWorkflowService } from '../review-workflow/review-workflow.service';
import { ReviewStage } from '../review-workflow/review-workflow.entity';
import { MailService } from '../mail/mail.service';

const MY_SKB_WORKFLOW_MODULE = 'myskb';

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
        private readonly reviewWorkflowService: ReviewWorkflowService,
        private readonly mail: MailService,
    ) { }

    private buildWorkspaceUrl(path: string) {
        const fallback = process.env.WORKSPACE_URL || process.env.FRONTEND_URL || '';
        const base = fallback.replace(/\/$/, '');
        return base ? `${base}${path.startsWith('/') ? '' : '/'}${path}` : undefined;
    }

    private formatStatusLabel(raw: string | null | undefined) {
        if (!raw) return 'Submitted';
        return raw
            .toString()
            .trim()
            .replace(/[_\s]+/g, ' ')
            .toLowerCase()
            .replace(/\b\w/g, (c) => c.toUpperCase());
    }

    private parsePaymentReference(reference: string) {
        if (!reference) return null;
        const parts = reference.split('-');
        if (parts.length < 3) return null;
        if (parts[0].toUpperCase() !== 'MYSKB') return null;
        const kindRaw = parts[1]?.toLowerCase();
        const projectId = Number(parts[2]);
        if (!projectId || Number.isNaN(projectId)) return null;
        if (kindRaw !== 'processing' && kindRaw !== 'permit') return null;
        return { projectId, kind: kindRaw as 'processing' | 'permit' };
    }

    private async notifyFinalStageMembers(project: MySkbProject) {
        try {
            const workflow = await this.reviewWorkflowService.getModuleWorkflow(MY_SKB_WORKFLOW_MODULE);
            const finalStage = workflow.stages.find((stage) => stage.stage === ReviewStage.FINAL && stage.enabled);
            if (!finalStage) return;
            const recipients = (finalStage.members || []).map((member) => member.email).filter(Boolean);
            if (!recipients.length) return;
            const projectTitle = (project as any)?.data?.projectTitle || `Project #${project.id}`;
            const reviewUrl = this.buildWorkspaceUrl(`/myskb/project/${project.id}`);
            await Promise.all(
                recipients.map((email) =>
                    this.mail.sendMySkbFinalApprovalRequest(email, {
                        projectId: project.id,
                        projectTitle,
                        reviewUrl,
                    })
                )
            );
        } catch (err) {
            console.error('[MySkbProjectService] Failed to notify final reviewers:', err?.message || err);
        }
    }

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
                // persist coordinates if provided at top-level or within data
                const lat = (data as any)?.latitude ?? (data as any)?.lat;
                const lng = (data as any)?.longitude ?? (data as any)?.lng;
                if (lat !== undefined) (existing as any).latitude = lat;
                if (lng !== undefined) (existing as any).longitude = lng;
                existing.data = data;
                return await this.repo.save(existing);
            }
            // fall through to create/reuse a draft if not found
        }

        const draft = this.repo.create({
            businessId,
            createdBy,
            status: ProjectStatus.DRAFT,
            data,
            latitude: (data as any)?.latitude ?? (data as any)?.lat,
            longitude: (data as any)?.longitude ?? (data as any)?.lng,
        });

        return await this.repo.save(draft);
    }

    async adminGetById(id: number) {
        return this.getByIdWithOwners(id);
    }

    async submit(businessId: number, createdByUserId: number, ownersUserIds: number[], data?: Record<string, any>) {
        let payload = data;
        const firstStage = await this.reviewWorkflowService.getFirstEnabledStage(MY_SKB_WORKFLOW_MODULE);

        const submission = this.repo.create({
            businessId,
            createdBy: createdByUserId,
            status: ProjectStatus.SUBMITTED,
            currentReviewStage: firstStage,
            data: payload,
            latitude: (payload as any)?.latitude ?? (payload as any)?.lat,
            longitude: (payload as any)?.longitude ?? (payload as any)?.lng,
        });
        await this.repo.save(submission);
        await this.insertOwnerInformation(submission.id, submission.businessId, ownersUserIds);
        return submission;
    }

    async insertOwnerInformation(projectId: number, businessId: number, ownerUserIds: number[]) {
        if (!Array.isArray(ownerUserIds) || !ownerUserIds.length) return;
        const values = ownerUserIds.map((uid) => ({ projectId, businessId, ownerUserId: uid }));
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
                const lat = (data as any)?.latitude ?? (data as any)?.lat;
                const lng = (data as any)?.longitude ?? (data as any)?.lng;
                if (lat !== undefined) (existing as any).latitude = lat;
                if (lng !== undefined) (existing as any).longitude = lng;
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
            latitude: (data as any)?.latitude ?? (data as any)?.lat,
            longitude: (data as any)?.longitude ?? (data as any)?.lng,
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
            userId: p.createdBy,
            latitude: (p as any).latitude ?? null,
            longitude: (p as any).longitude ?? null,
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
        // Attach business info without per-row queries
        const bizIds = Array.from(new Set(rows.map((p) => p.businessId).filter((v) => typeof v === 'number')));
        const businesses = bizIds.length ? await this.businessRepo.findBy({ id: In(bizIds as number[]) }) : [];
        const bizMap = new Map<number, any>();
        for (const b of businesses) bizMap.set((b as any).id, b);
        const data = rows.map((p) => {
            const b = bizMap.get(p.businessId);
            const businessName = b ? ((b as any).name || (b as any).companyName || (b as any).company_name || (b as any).registration_name) : undefined;
            const rawStatus = String(p.status || '');
            return {
                id: p.id,
                projectTitle: (p as any).data?.projectTitle ?? null,
                created_at: p.createdAt ? p.createdAt.toISOString() : undefined,
                status: rawStatus,
                status_raw: rawStatus,
                data: p.data,
                businessId: p.businessId,
                business: businessName ? { id: p.businessId, name: businessName } : { id: p.businessId },
                userId: p.createdBy,
                latitude: (p as any).latitude ?? null,
                longitude: (p as any).longitude ?? null,
                reviewStage: p.currentReviewStage ?? null,
            };
        });
        return { data, total, limit, offset };
    }

    async getByIdWithOwners(id: number, viewerUserId?: number, businessId?: number, status?: string) {

        const qb = this.repo.createQueryBuilder('p')
            .leftJoin(MySkbProjectOwner, 'po', 'po.projectId = p.id')
            .leftJoin(User, 'u', 'u.id = po.ownerUserId')
            .where('p.id = :id', { id });
        // is business id provided, filter by it and the viewerUserId ignore it

        if (businessId) {
            qb.andWhere('p.businessId = :bid', { bid: Number(businessId) });
            qb.andWhere('(p.createdBy = :viewer OR po.ownerUserId = :viewer)', { viewer: viewerUserId });
        }

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
            // businessId is now denormalized on project_owner; we still constrain to project.businessId for safety
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
        const statusTitle = this.formatStatusLabel(statusRaw);
        return {
            id: project.id,
            business_id: project.businessId,
            business: businessName ? { id: project.businessId, name: businessName } : { id: project.businessId },
            status: statusTitle,
            status_raw: statusRaw,
            created_at: project.createdAt ? project.createdAt.toISOString() : undefined,
            data: project.data,
            owners: ownersFormatted,
            latitude: (project as any).latitude ?? null,
            longitude: (project as any).longitude ?? null,
            review_stage: project.currentReviewStage ?? null,
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
        // Attach business info without per-row queries
        const bizIds = Array.from(new Set(rows.map((p) => p.businessId).filter((v) => typeof v === 'number')));
        const businesses = bizIds.length ? await this.businessRepo.findBy({ id: In(bizIds as number[]) }) : [];
        const bizMap = new Map<number, any>();
        for (const b of businesses) bizMap.set((b as any).id, b);
        const data = rows.map((p) => {
            const b = bizMap.get(p.businessId);
            const businessName = b ? ((b as any).name || (b as any).companyName || (b as any).company_name || (b as any).registration_name) : undefined;
            const rawStatus = String(p.status || '');
            return {
                id: p.id,
                projectTitle: (p as any).data?.projectTitle ?? null,
                created_at: p.createdAt ? p.createdAt.toISOString() : undefined,
                status: rawStatus,
                status_raw: rawStatus,
                data: p.data,
                businessId: p.businessId,
                business: businessName ? { id: p.businessId, name: businessName } : { id: p.businessId },
                userId: p.createdBy,
                latitude: (p as any).latitude ?? null,
                longitude: (p as any).longitude ?? null,
            };
        });
        return { data, total, limit, offset };
    }

    async review(
        id: number,
        reviewerUserId: number,
        status: 'Approved' | 'Rejected' | 'approved' | 'rejected',
        reason?: string,
        reviewerRole?: string,
    ) {
        const project = await this.repo.findOne({ where: { id } });
        if (!project) throw new NotFoundException('Project not found');

        const activeStages = await this.reviewWorkflowService.getActiveStages(MY_SKB_WORKFLOW_MODULE);
        if (!activeStages.length) {
            throw new ForbiddenException('No review stages configured for this module.');
        }

        const orderedStageKeys = activeStages.map((stage) => stage.stage);
        let currentStage: ReviewStage | null = project.currentReviewStage && orderedStageKeys.includes(project.currentReviewStage)
            ? project.currentReviewStage
            : orderedStageKeys[0];
        if (!currentStage) throw new ForbiddenException('Review stage could not be resolved.');

        project.currentReviewStage = currentStage;

        const canBypassAssignment = reviewerRole === UserRole.SUPERADMIN;
        if (!canBypassAssignment) {
            await this.reviewWorkflowService.assertUserAssigned(MY_SKB_WORKFLOW_MODULE, currentStage, reviewerUserId);
        }

        const lower = String(status).toLowerCase();
        if (lower !== 'approved' && lower !== 'rejected') {
            throw new ForbiddenException('Invalid review status');
        }

        const now = new Date().toISOString();
        const data = project.data ? { ...project.data } : {};
        const history: any[] = Array.isArray((data as any)._review_history) ? [...(data as any)._review_history] : [];
        const auditEntry = {
            reviewerUserId,
            reviewerRole,
            stage: currentStage,
            decision: lower,
            reason,
            at: now,
        };
        history.push(auditEntry);
        (data as any)._review_history = history;
        (data as any)._review = auditEntry;
        project.data = data;

        if (lower === 'approved') {
            const currentIndex = orderedStageKeys.indexOf(currentStage);
            const hasNext = currentIndex > -1 && currentIndex < orderedStageKeys.length - 1;
            if (hasNext) {
                project.currentReviewStage = orderedStageKeys[currentIndex + 1];
                if (project.currentReviewStage === ReviewStage.FINAL) {
                    project.status = ProjectStatus.PENDING_PROCESSING_PAYMENT;
                } else {
                    project.status = ProjectStatus.SUBMITTED;
                }
            } else {
                if (project.status !== ProjectStatus.PROCESSING_PAYMENT_PAID && project.status !== ProjectStatus.PENDING_PERMIT_PAYMENT) {
                    throw new ForbiddenException('Processing payment must be marked as paid before final approval.');
                }
                project.currentReviewStage = null;
                project.status = ProjectStatus.PENDING_PERMIT_PAYMENT;
            }
        } else {
            project.currentReviewStage = null;
            project.status = ProjectStatus.REJECTED;
        }

        const saved = await this.repo.save(project);
        return {
            id: saved.id,
            status: saved.status,
            reviewed_at: now,
            reviewer_user_id: reviewerUserId,
            reason,
            review_stage: currentStage,
            next_stage: saved.currentReviewStage ?? null,
            decision: lower,
        };
    }

    async markProcessingPaymentPaid(projectId: number, metadata: { reference?: string; paidAt?: Date | string }) {
        const project = await this.repo.findOne({ where: { id: projectId } });
        if (!project) throw new NotFoundException('Project not found');
        if (project.status !== ProjectStatus.PENDING_PROCESSING_PAYMENT) {
            throw new BadRequestException('Processing payment cannot be marked paid in the current state');
        }
        const data = project.data ? { ...project.data } : {};
        const paidAt = metadata?.paidAt ? new Date(metadata.paidAt).toISOString() : new Date().toISOString();
        (data as any)._processingPayment = {
            ...(data as any)._processingPayment,
            reference: metadata?.reference ?? (data as any)._processingPayment?.reference ?? null,
            paidAt,
        };
        project.data = data;
        project.status = ProjectStatus.PROCESSING_PAYMENT_PAID;
        await this.repo.save(project);
        await this.notifyFinalStageMembers(project);
        return { id: project.id, status: project.status, paidAt };
    }

    async markPermitPaymentPaid(projectId: number, metadata: { reference?: string; paidAt?: Date | string }) {
        const project = await this.repo.findOne({ where: { id: projectId } });
        if (!project) throw new NotFoundException('Project not found');
        if (project.status !== ProjectStatus.PENDING_PERMIT_PAYMENT && project.status !== ProjectStatus.PERMIT_ACTIVE) {
            throw new BadRequestException('Permit payment is not requested for this project');
        }
        const data = project.data ? { ...project.data } : {};
        const paidAt = metadata?.paidAt ? new Date(metadata.paidAt).toISOString() : new Date().toISOString();
        (data as any)._permitPayment = {
            ...(data as any)._permitPayment,
            reference: metadata?.reference ?? (data as any)._permitPayment?.reference ?? null,
            paidAt,
        };
        project.data = data;
        project.status = ProjectStatus.PERMIT_ACTIVE;
        await this.repo.save(project);
        return { id: project.id, status: project.status, paidAt };
    }

    async handlePaymentReference(orderId: string, payload: { amount?: number; paidAt?: string | Date } = {}) {
        const parsed = this.parsePaymentReference(orderId);
        if (!parsed) return false;
        const project = await this.repo.findOne({ where: { id: parsed.projectId } });
        if (!project) return false;
        const paidAtIso = payload?.paidAt ? new Date(payload.paidAt).toISOString() : new Date().toISOString();
        const data = project.data ? { ...project.data } : {};
        if (parsed.kind === 'processing') {
            (data as any)._processingPayment = {
                ...(data as any)._processingPayment,
                reference: orderId,
                amount: payload?.amount ?? (data as any)._processingPayment?.amount ?? null,
                paidAt: paidAtIso,
            };
            project.data = data;
            if (project.status === ProjectStatus.PENDING_PROCESSING_PAYMENT) {
                project.status = ProjectStatus.PROCESSING_PAYMENT_PAID;
                await this.repo.save(project);
                await this.notifyFinalStageMembers(project);
            } else {
                await this.repo.save(project);
            }
            return true;
        }
        if (parsed.kind === 'permit') {
            (data as any)._permitPayment = {
                ...(data as any)._permitPayment,
                reference: orderId,
                amount: payload?.amount ?? (data as any)._permitPayment?.amount ?? null,
                paidAt: paidAtIso,
            };
            project.data = data;
            if (project.status === ProjectStatus.PENDING_PERMIT_PAYMENT) {
                project.status = ProjectStatus.PERMIT_ACTIVE;
            }
            await this.repo.save(project);
            return true;
        }
        return false;
    }
}
