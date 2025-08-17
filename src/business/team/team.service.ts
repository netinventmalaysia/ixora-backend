import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TeamMember } from './team-member.entity';
import { Repository } from 'typeorm';
import { MailService } from 'src/mail/mail.service';
import { Business } from '../registration/business.entity';
import { v4 as uuidv4 } from 'uuid';
import { addMinutes } from 'date-fns';

@Injectable()
export class TeamService {
    constructor(
        @InjectRepository(TeamMember)
        private teamRepo: Repository<TeamMember>,
        private mailService: MailService,
        @InjectRepository(Business)
        private businessRepo: Repository<Business>
    ) { }

    async getTeamByBusinessId(businessId: number) {
        return this.teamRepo.find({
            where: { businessId },
            order: { createdAt: 'DESC' },
        });
    }

    async inviteMember(businessId: number, email: string, invitedBy: number) {
        const exists = await this.teamRepo.findOne({ where: { businessId, email } });
        if (exists) throw new Error('Member already invited or exists');

        // ✅ Fetch business name first (Assuming you have BusinessRepo injected)
        const business = await this.businessRepo.findOne({ where: { id: businessId } });
        const token = uuidv4();
        const expiry = addMinutes(new Date(), 15); // expires in 15 mins
        if (!business) throw new Error('Business not found');

        business.invitationToken = token;
        business.invitationTokenExpires = expiry;
        await this.businessRepo.save(business);

        const member = this.teamRepo.create({
            businessId,
            email,
            role: 'business',
            invitedBy,
        });

        await this.teamRepo.save(member);
        const invitationUrl = `${process.env.FRONTEND_URL}/business-invite?token=${token}`;
        await this.mailService.sendInviteEmail(email, {
            name: business.companyName,
            invitationUrl,
        });

        return member;
    }
    async validateInvite(token: string) {
        if (!token) {
            return { statusCode: 400, error: 'missing_token' };
        }
        const business = await this.businessRepo.findOne({ where: { invitationToken: token } });
        if (!business) {
            return { statusCode: 404, error: 'not_found' };
        }
        if (business.invitationTokenExpires && business.invitationTokenExpires < new Date()) {
            return { statusCode: 410, error: 'expired' };
        }
        return {
            valid: true,
            info: {
                businessId: business.id,
                businessName: business.companyName,
                inviterId: business.userId,
                invitedEmail: null,
                status: business.status,
                expiresAt: business.invitationTokenExpires,
                createdAt: business.createdAt,
            },
        };
    }

    async acceptInvite(token: string, userId: number) {
        if (!token) return { statusCode: 400, error: 'missing_token' };
        const business = await this.businessRepo.findOne({ where: { invitationToken: token } });
        if (!business) return { statusCode: 404, error: 'not_found' };
        if (business.invitationTokenExpires && business.invitationTokenExpires < new Date()) {
            return { statusCode: 410, error: 'expired' };
        }

        // idempotent: check if team member exists
        const existing = await this.teamRepo.findOne({ where: { businessId: business.id, userId } });
        if (existing) {
            return {
                success: true,
                alreadyAccepted: true,
                membership: { businessId: business.id, userId: existing.userId, role: existing.role, joinedAt: existing.createdAt },
            };
        }

        const member = this.teamRepo.create({ businessId: business.id, userId, email: '', role: 'business' });
        await this.teamRepo.save(member);

        // mark token consumed
    business.invitationToken = '';
    business.invitationTokenExpires = undefined as any;
        await this.businessRepo.save(business);

        return { success: true, alreadyAccepted: false, membership: { businessId: business.id, userId, role: member.role, joinedAt: member.createdAt } };
    }
    async updateMemberRole(memberId: number, role: string) {
        const member = await this.teamRepo.findOne({ where: { id: memberId } });
        if (!member) throw new NotFoundException('Team member not found');

        member.role = role;
        return this.teamRepo.save(member);
    }

    async removeMember(memberId: number) {
        const member = await this.teamRepo.findOne({ where: { id: memberId } });
        if (!member) throw new NotFoundException('Team member not found');

        return this.teamRepo.remove(member);
    }
}

