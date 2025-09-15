import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MySkbProject, ProjectStatus } from './project.entity';

@Injectable()
export class MySkbProjectService {
  constructor(
    @InjectRepository(MySkbProject)
    private readonly repo: Repository<MySkbProject>,
  ) {}

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
}
