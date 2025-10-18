import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { MySkbOwnership, OwnershipScope, OwnershipStatus } from './ownership.entity';
import { InviteOwnershipDto, ListOwnershipQueryDto, UpdateOwnershipDto } from './dto/ownership.dto';
import { User, UserRole } from '../users/user.entity';
import { MailService } from '../mail/mail.service';
import { randomBytes } from 'crypto';
import { MySkbProjectOwner } from './project-owner.entity';

@Injectable()
export class MySkbOwnershipService {
  constructor(
    @InjectRepository(MySkbOwnership) private readonly repo: Repository<MySkbOwnership>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(MySkbProjectOwner) private readonly projectOwners: Repository<MySkbProjectOwner>,
    private readonly mail: MailService,
  ) { }

  normalizeEmail(email: string) {
    return (email || '').trim().toLowerCase();
  }

  async list(query: ListOwnershipQueryDto) {
    if (!query.business_id) throw new BadRequestException({ message: 'business_id required' });
    const take = query.limit && query.limit > 0 ? query.limit : 50;
    const skip = query.offset && query.offset >= 0 ? query.offset : 0;
    const where: any = { businessId: query.business_id };
    if (query.status) where.status = query.status;
    if (query.q) where.email = ILike(`%${query.q}%`);

    const order = { createdAt: 'DESC' as const };

    const [rows, total] = await this.repo.findAndCount({ where, take, skip, order });
    const data = rows.map((r) => ({
      id: r.id,
      user_id: r.userId ?? null,
      name: r.name ?? null,
      email: r.email,
      role: r.role ?? null,
      project: r.project ?? null,
      avatar_url: r.avatarUrl ?? null,
      last_seen_iso: r.lastSeenIso ?? null,
      status: r.status,
      created_at: r.createdAt?.toISOString(),
      updated_at: r.updatedAt?.toISOString(),
      scope: r.scope ?? undefined,
    }));
    return { data, total, limit: take, offset: skip };
  }

  async invite(dto: InviteOwnershipDto) {
    const email = this.normalizeEmail(dto.email);
    if (!dto.business_id) throw new BadRequestException({ message: 'business_id required' });

    const existing = await this.repo.findOne({ where: { businessId: dto.business_id, email } });
    if (existing) {
      throw new ConflictException({ message: 'Ownership already exists for this email and business' });
    }

    // Check if user exists
    const user = await this.users.findOne({ where: { email } });
    if (user) {
      const created = await this.repo.save(this.repo.create({
        businessId: dto.business_id,
        email,
        userId: user.id,
        status: OwnershipStatus.APPROVED,
        role: dto.role ?? null,
        project: dto.project ?? null,
        scope: OwnershipScope.PROJECT_ONLY,
      }));
      return { status: true, user_exists: true, invited: false, created };
    }

    // Create pending invite with token
    const token = randomBytes(16).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days
    const created = await this.repo.save(this.repo.create({
      businessId: dto.business_id,
      email,
      status: OwnershipStatus.PENDING,
      role: dto.role ?? null,
      project: dto.project ?? null,
      inviteToken: token,
      inviteTokenExpires: expires,
      scope: OwnershipScope.PROJECT_ONLY,
    }));

    // Send invite email with signup link
    const frontend = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
    const url = `${frontend || ''}/signup?invite=${token}`;
    await this.mail.sendInviteEmail(email, { name: 'MySKB', invitationUrl: url });

    return { status: true, user_exists: false, invited: true, invite_email_sent: true, created };
  }

  async update(id: number, dto: UpdateOwnershipDto) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException({ message: 'Ownership not found' });
    if (dto.status) row.status = dto.status;
    if (dto.role !== undefined) row.role = dto.role;
    if (dto.project !== undefined) row.project = dto.project;
    return this.repo.save(row);
  }

  async remove(id: number) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException({ message: 'Ownership not found' });
    await this.repo.remove(row);
    return { message: 'Removed' };
  }

  async access(businessId: number, userId?: number) {
    // Interpret [] as full access (no restriction). ['Application'] means application-only.
    // Restrict per-user, not globally per business.
    if (!businessId || Number.isNaN(Number(businessId))) {
      // If business is unknown, do not restrict
      return { allowedTabs: [] };
    }

    if (userId && !Number.isNaN(Number(userId))) {
      // Consultants get full access to MySKB tabs
      const user = await this.users.findOne({ where: { id: userId } });
      if (user?.role === UserRole.CONSULTANT) {
        return { allowedTabs: [] };
      }
      // Check current user's ownership record for this business
      const userOwnership = await this.repo.findOne({ where: { businessId, userId, status: OwnershipStatus.APPROVED } });
      if (userOwnership?.scope === OwnershipScope.PROJECT_ONLY) {
        return { allowedTabs: ['Application'] };
      }
      // If user has an ownership (full or unspecified scope), grant full access
      if (userOwnership) {
        return { allowedTabs: [] };
      }

      // If user is explicitly a project co-owner (without a general ownership record), limit to Application
      const exists = await this.projectOwners
        .createQueryBuilder('po')
        .innerJoin('myskb_projects', 'p', 'p.id = po.projectId AND p.businessId = :bid', { bid: businessId })
        .where('po.ownerUserId = :uid', { uid: userId })
        .limit(1)
        .getRawOne();
      if (exists) {
        return { allowedTabs: ['Application'] };
      }
    }

    // Default: full access (no explicit restrictions)
    return { allowedTabs: [] };
  }
}
