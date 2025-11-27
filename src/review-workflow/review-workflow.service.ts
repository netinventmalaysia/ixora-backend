import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewStage, ReviewWorkflowStage, ReviewWorkflowStageMember } from './review-workflow.entity';
import { UpdateModuleWorkflowDto } from './dto/update-workflow.dto';
import { User } from '../users/user.entity';

export interface ReviewWorkflowStageView {
    stage: ReviewStage;
    label: string;
    enabled: boolean;
    orderIndex: number;
    members: Array<{
        userId: number;
        email: string;
        name?: string;
    }>;
}

interface EnsureStageOptions {
    withMembers?: boolean;
}

const STAGE_ORDER: ReviewStage[] = [ReviewStage.LEVEL1, ReviewStage.LEVEL2, ReviewStage.FINAL];
const STAGE_LABELS: Record<ReviewStage, string> = {
    [ReviewStage.LEVEL1]: 'First Reviewer',
    [ReviewStage.LEVEL2]: 'Second Reviewer',
    [ReviewStage.FINAL]: 'Final Approval',
};

@Injectable()
export class ReviewWorkflowService {
    constructor(
        @InjectRepository(ReviewWorkflowStage)
        private readonly stageRepo: Repository<ReviewWorkflowStage>,
        @InjectRepository(ReviewWorkflowStageMember)
        private readonly memberRepo: Repository<ReviewWorkflowStageMember>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
    ) { }

    async getModuleWorkflow(module: string): Promise<{ module: string; stages: ReviewWorkflowStageView[] }> {
        const normalized = this.normalizeModule(module);
        const stages = await this.ensureStages(normalized, { withMembers: true });
        return {
            module: normalized,
            stages: this.serializeStages(stages),
        };
    }

    async updateModuleWorkflow(module: string, payload: UpdateModuleWorkflowDto) {
        const normalized = this.normalizeModule(module);
        const stages = await this.ensureStages(normalized, { withMembers: true });
        const stageMap = new Map(stages.map((stage) => [stage.stage, stage] as const));

        for (const stageInput of payload.stages ?? []) {
            const stage = stageMap.get(stageInput.stage);
            if (!stage) continue;
            if (typeof stageInput.enabled === 'boolean') stage.enabled = stageInput.enabled;
            await this.replaceMembers(stage, stageInput.user_emails ?? []);
        }

        const finalStage = stageMap.get(ReviewStage.FINAL);
        if (finalStage?.enabled === false) {
            throw new BadRequestException('Final approval stage cannot be disabled.');
        }

        await this.stageRepo.save([...stageMap.values()]);
        return this.getModuleWorkflow(normalized);
    }

    async getFirstEnabledStage(module: string): Promise<ReviewStage | null> {
        const stages = await this.ensureStages(this.normalizeModule(module));
        const first = stages.find((stage) => stage.enabled);
        return first?.stage ?? null;
    }

    async getNextEnabledStage(module: string, currentStage: ReviewStage): Promise<ReviewStage | null> {
        const stages = await this.ensureStages(this.normalizeModule(module));
        const enabled = stages.filter((stage) => stage.enabled).map((stage) => stage.stage);
        const idx = enabled.indexOf(currentStage);
        if (idx === -1) return enabled.length ? enabled[0] : null;
        return idx < enabled.length - 1 ? enabled[idx + 1] : null;
    }

    async getActiveStages(module: string): Promise<ReviewWorkflowStage[]> {
        const stages = await this.ensureStages(this.normalizeModule(module));
        return stages.filter((stage) => stage.enabled);
    }

    async assertUserAssigned(module: string, stageKey: ReviewStage, userId: number) {
        const normalized = this.normalizeModule(module);
        const stage = await this.stageRepo.findOne({ where: { module: normalized, stage: stageKey } });
        if (!stage || !stage.enabled) throw new ForbiddenException('Review stage is not active.');
        const exists = await this.memberRepo.findOne({ where: { stageId: stage.id, userId } });
        if (!exists) throw new ForbiddenException('You are not assigned to this review stage.');
    }

    private serializeStages(stages: ReviewWorkflowStage[]): ReviewWorkflowStageView[] {
        return stages
            .sort((a, b) => (a.orderIndex - b.orderIndex) || (a.id - b.id))
            .map((stage) => ({
                stage: stage.stage,
                label: STAGE_LABELS[stage.stage],
                enabled: stage.enabled,
                orderIndex: stage.orderIndex,
                members: (stage.members || []).map((member) => ({
                    userId: member.userId,
                    email: member.userEmail,
                    name: member.user ? [member.user.firstName, member.user.lastName].filter(Boolean).join(' ').trim() || member.user.email : member.userEmail,
                })),
            }));
    }

    private async ensureStages(module: string, options: EnsureStageOptions = {}): Promise<ReviewWorkflowStage[]> {
        const normalized = this.normalizeModule(module);
        let stages = await this.stageRepo.find({
            where: { module: normalized },
            relations: options.withMembers ? ['members', 'members.user'] : [],
        });
        if (!stages.length) {
            const defaults = STAGE_ORDER.map((stageKey, idx) => this.stageRepo.create({
                module: normalized,
                stage: stageKey,
                orderIndex: idx + 1,
                enabled: true,
            }));
            await this.stageRepo.save(defaults);
            stages = await this.stageRepo.find({
                where: { module: normalized },
                relations: options.withMembers ? ['members', 'members.user'] : [],
            });
        }

        const existingKeys = new Set(stages.map((stage) => stage.stage));
        const missing = STAGE_ORDER.filter((key) => !existingKeys.has(key));
        if (missing.length) {
            const inserts = missing.map((stageKey) => this.stageRepo.create({
                module: normalized,
                stage: stageKey,
                orderIndex: STAGE_ORDER.indexOf(stageKey) + 1,
                enabled: true,
            }));
            await this.stageRepo.save(inserts);
            stages = await this.stageRepo.find({
                where: { module: normalized },
                relations: options.withMembers ? ['members', 'members.user'] : [],
            });
        }

        return stages.sort((a, b) => (a.orderIndex - b.orderIndex) || (a.id - b.id));
    }

    private async replaceMembers(stage: ReviewWorkflowStage, emails: string[]) {
        const normalizedEmails = Array.from(new Set((emails || []).map((email) => email.trim().toLowerCase()).filter(Boolean)));
        const existingMembers = stage.members || [];
        if (!normalizedEmails.length) {
            if (existingMembers.length) await this.memberRepo.remove(existingMembers);
            stage.members = [];
            return;
        }

        const users = await this.userRepo.createQueryBuilder('user')
            .where('LOWER(user.email) IN (:...emails)', { emails: normalizedEmails })
            .getMany();
        const foundEmailMap = new Map(users.map((user) => [user.email.toLowerCase(), user] as const));
        const missing = normalizedEmails.filter((email) => !foundEmailMap.has(email));
        if (missing.length) {
            throw new NotFoundException(`Users not found for emails: ${missing.join(', ')}`);
        }

        const toKeep = new Map(normalizedEmails.map((email) => [email, true] as const));
        const removals = existingMembers.filter((member) => !toKeep.has(member.userEmail.toLowerCase()));
        if (removals.length) await this.memberRepo.remove(removals);

        const existingEmailSet = new Set(existingMembers.map((member) => member.userEmail.toLowerCase()));
        const additions = normalizedEmails
            .filter((email) => !existingEmailSet.has(email))
            .map((email) => this.memberRepo.create({
                stageId: stage.id,
                userId: foundEmailMap.get(email)!.id,
                userEmail: foundEmailMap.get(email)!.email,
            }));
        if (additions.length) await this.memberRepo.save(additions);

        const refreshedMembers = await this.memberRepo.find({ where: { stageId: stage.id }, relations: ['user'] });
        stage.members = refreshedMembers;
    }

    private normalizeModule(module: string) {
        if (!module) throw new BadRequestException('Module is required');
        return module.trim().toLowerCase();
    }
}
