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
import { User } from 'src/users/user.entity';
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
        const business = await this.businessRepo.findOne({
            where: { id },
        });

        if (!business) {
            throw new Error('Business not found');
        }

        return business;
    }

    async update(id: number, data: CreateBusinessDto) {
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
        await this.businessRepo.update(id, { status });
        return this.findById(id);
    }
}
