import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Business } from './business.entity';
import { Repository } from 'typeorm';
import { CreateBusinessDto } from './dto/create-business.dto';
import { mapBusinessToListItem } from './business.mapper';
import { UploadsEntity } from '../../uploads/uploads.entity';
import { VerificationService } from '../../verification/verification.service';
import { TeamMember, TeamMemberStatus } from '../team/team-member.entity';
import { MailService } from 'src/mail/mail.service';
import { User, UserRole } from 'src/users/user.entity';
import { v4 as uuidv4 } from 'uuid';
import { addMinutes } from 'date-fns';

@Injectable()
export class BusinessService {
    constructor(
        @InjectRepository(Business)
        private businessRepo: Repository<Business>,
        @InjectRepository(UploadsEntity)
        private uploadsRepo: Repository<UploadsEntity>,
        private readonly verificationService: VerificationService,
        @InjectRepository(TeamMember)
        private teamRepo: Repository<TeamMember>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
        private mailService: MailService,
    ) { }

    async create(data: CreateBusinessDto): Promise<Business> {
        // Guard against duplicate registration numbers
        const existing = await this.businessRepo.findOne({ where: { registrationNumber: data.registrationNumber } });
        if (existing) {
            // If duplicate, notify the existing owner and create a pending team membership for the requester
            if (!data.userId) {
                throw new BadRequestException('Registration number already exists');
            }
            const owner = await this.userRepo.findOne({ where: { id: existing.userId } });
            const requester = await this.userRepo.findOne({ where: { id: data.userId } });
            if (!owner || !requester) {
                throw new BadRequestException('Registration number already exists');
            }
            // upsert pending team member for requester email
            let member = await this.teamRepo.findOne({ where: { businessId: existing.id, email: requester.email } });
            if (!member) {
                member = this.teamRepo.create({
                    businessId: existing.id,
                    email: requester.email,
                    userId: requester.id,
                    invitedBy: owner.id,
                    role: 'staff',
                    status: TeamMemberStatus.PENDING,
                    token: uuidv4(),
                    tokenExpires: addMinutes(new Date(), 60), // 1 hour for owner approval
                });
            } else {
                // refresh token/expiry if already exists but pending
                if (member.status !== TeamMemberStatus.ACTIVE) {
                    member.token = uuidv4();
                    member.tokenExpires = addMinutes(new Date(), 60);
                    member.role = 'staff';
                }
            }
            await this.teamRepo.save(member);

            const backend = (process.env.BACKEND_URL || '').replace(/\/$/, '');
            const approveUrl = `${backend || ''}/business/owner/approve-duplicate?token=${member.token}`;
            const declineUrl = `${backend || ''}/business/owner/decline-duplicate?token=${member.token}`;
            await this.mailService.sendDuplicateRegistrationAttemptEmail(owner.email, {
                businessName: existing.companyName,
                registrationNumber: existing.registrationNumber,
                requesterEmail: requester.email,
                approveUrl,
                declineUrl,
            });
            throw new BadRequestException('Registration number already exists. Owner has been notified to approve adding you as staff.');
        }
        const business = await this.businessRepo.save(this.businessRepo.create(data));

        // Trigger verification if a certificate path is provided and upload record exists
        if (business.certificateFilePath) {
            const upload = await this.uploadsRepo.findOne({ where: { path: business.certificateFilePath } });
            if (upload) {
                const ver = await this.verificationService.queueBusinessRegistrationVerification({
                    businessId: business.id,
                    uploadId: upload.id,
                    documentType: 'business_registration',
                });
                this.verificationService.processVerification(ver.id).catch(() => null);
            }
        }

        return business;
    }

    async findByUser(userId: number) {
        return this.businessRepo.find({
            where: { /* createdBy: userId */ }, // Add filter if needed
            order: { createdAt: 'DESC' },
        });
    }

    async findAllMappedByUser(userId: number) {
        const businesses = await this.businessRepo.find({
            where: { /* createdBy: userId */ },  // Add if you have relation
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });

        return businesses.map(mapBusinessToListItem);
    }

    async findById(id: number) {
        if (typeof id !== 'number' || !Number.isFinite(id) || id <= 0) {
            throw new BadRequestException('Invalid business id');
        }
        const business = await this.businessRepo.findOne({
            where: { id },
        });

        if (!business) {
            throw new BadRequestException('Business not found');
        }

        return business;
    }

    async update(id: number, data: CreateBusinessDto) {
        if (typeof id !== 'number' || !Number.isFinite(id) || id <= 0) {
            throw new BadRequestException('Invalid business id');
        }
        if (data.registrationNumber) {
            const clash = await this.businessRepo.findOne({ where: { registrationNumber: data.registrationNumber } });
            if (clash && clash.id !== id) {
                throw new BadRequestException('Registration number already exists');
            }
        }
        await this.businessRepo.update(id, data);
        return this.findById(id);
    }

    async updateStatus(id: number, status: string) {
        if (typeof id !== 'number' || !Number.isFinite(id) || id <= 0) {
            throw new BadRequestException('Invalid business id');
        }
        await this.businessRepo.update(id, { status });
        return this.findById(id);
    }

    // Submit LAM registration number and document path for a business
    async submitLam(businessId: number, body: { lamNumber: string; lamDocumentPath: string }) {
        if (typeof businessId !== 'number' || !Number.isFinite(businessId) || businessId <= 0) {
            throw new BadRequestException('Invalid business id');
        }
        if (!body?.lamNumber || !body?.lamNumber.trim()) {
            throw new BadRequestException('lamNumber is required');
        }
        const lamNumber = body.lamNumber.trim();
        // Enforce uniqueness across businesses
        const clash = await this.businessRepo.findOne({ where: { lamNumber } });
        if (clash && clash.id !== businessId) {
            throw new BadRequestException('LAM number already used by another business');
        }
        const patch: Partial<Business> = {
            lamNumber,
            lamDocumentPath: body.lamDocumentPath || null,
            lamStatus: 'Pending',
            lamVerifiedAt: null,
        } as any;
        await this.businessRepo.update(businessId, patch);

        // Queue a verification record if we have a document upload that matches path
        if (patch.lamDocumentPath) {
            const upload = await this.uploadsRepo.findOne({ where: { path: patch.lamDocumentPath } });
            if (upload) {
                await this.verificationService.queueBusinessRegistrationVerification({
                    businessId,
                    uploadId: upload.id,
                    documentType: 'lam_registration',
                });
            }
        }
        return this.findById(businessId);
    }

    // Admin verifies LAM and upgrades owner to consultant on approval
    async verifyLam(businessId: number, status: 'Approved' | 'Rejected', reason?: string) {
        if (typeof businessId !== 'number' || !Number.isFinite(businessId) || businessId <= 0) {
            throw new BadRequestException('Invalid business id');
        }
        const business = await this.findById(businessId);
        if (!business) throw new BadRequestException('Business not found');
        const patch: Partial<Business> = {
            lamStatus: status,
            lamVerifiedAt: status === 'Approved' ? new Date() : null,
            lamStatusReason: reason ? String(reason).slice(0, 255) : null,
        } as any;
        await this.businessRepo.update(businessId, patch);
        // On approval, promote owner to consultant role
        if (status === 'Approved' && business.userId) {
            const user = await this.userRepo.findOne({ where: { id: business.userId } });
            if (user && user.role !== UserRole.CONSULTANT) {
                user.role = UserRole.CONSULTANT;
                await this.userRepo.save(user);
            }
        }
        return this.findById(businessId);
    }

    async listByLamStatus(status: string, limit = 50, offset = 0) {
        try {
            const [rows, total] = await this.businessRepo.findAndCount({
                where: { lamStatus: status },
                order: { updatedAt: 'DESC' },
                take: limit,
                skip: offset,
            } as any);
            return { data: rows, total, limit, offset };
        } catch (err) {
            // Defensive fallback: if the schema hasn't been migrated yet in this environment,
            // avoid taking down the approvals page. Return empty results and log a warning.
            // Typical error: Unknown column 'lamStatus' in 'where clause'.
            // Ensure the migration 1760748121082-AlterBusinessLAM has been applied.
            // eslint-disable-next-line no-console
            console.warn?.('[BusinessService.listByLamStatus] Fallback due to error:', err?.message || err);
            return { data: [], total: 0, limit, offset };
        }
    }
}
