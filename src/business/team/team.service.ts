import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TeamMember } from './team-member.entity';
import { Repository } from 'typeorm';
import { MailService } from 'src/mail/mail.service';
import { Business } from '../registration/business.entity';
import { User } from 'src/users/user.entity';
import { v4 as uuidv4 } from 'uuid';
import { addMinutes } from 'date-fns';
import { TeamMemberStatus } from './team-member.entity';

@Injectable()
export class TeamService {
    constructor(
        @InjectRepository(TeamMember)
        private teamRepo: Repository<TeamMember>,
        private mailService: MailService,
        @InjectRepository(Business)
        private businessRepo: Repository<Business>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
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
        // find user by email
        const user = await this.userRepo.findOne({ where: { email } });

        if (user && user.id === invitedBy) {
            throw new Error('You cannot invite yourself');
        }

        const member = this.teamRepo.create({
            businessId,
            email,
            role: 'business',
            invitedBy,
            userId: user?.id,
            token,
            tokenExpires: expiry,
            status: TeamMemberStatus.PENDING,
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
        const member = await this.teamRepo.findOne({ where: { token } });
        if (!member) return { statusCode: 404, error: 'not_found' };
        if (member.tokenExpires && member.tokenExpires < new Date()) return { statusCode: 410, error: 'expired' };
        const business = await this.businessRepo.findOne({ where: { id: member.businessId } });
        return {
            valid: true,
            info: {
                businessId: business?.id,
                businessName: business?.companyName,
                inviterId: member.invitedBy,
                invitedEmail: member.email,
                status: member.status,
                expiresAt: member.tokenExpires,
                createdAt: member.createdAt,
            },
        };
    }

    async acceptInvite(token: string, userId: number) {
        if (!token) return { statusCode: 400, error: 'missing_token' };
        const member = await this.teamRepo.findOne({ where: { token } });
        if (!member) return { statusCode: 404, error: 'not_found' };
        if (member.tokenExpires && member.tokenExpires < new Date()) return { statusCode: 410, error: 'expired' };

        // If already assigned to a user (accepted), return idempotent response
        if (member.userId) {
            return { success: true, alreadyAccepted: true, membership: { businessId: member.businessId, userId: member.userId, role: member.role, joinedAt: member.createdAt } };
        }
        // If userId not provided, try to find user by invited email
        let finalUserId = userId;
        if (!finalUserId && member.email) {
            const user = await this.userRepo.findOne({ where: { email: member.email } });
            if (user) finalUserId = user.id;
        }

        // tie invitee to business by setting userId and activating status
        member.userId = finalUserId;
        member.status = 'active';
        member.token = '';
        member.tokenExpires = undefined as any;
        await this.teamRepo.save(member);

        return { success: true, alreadyAccepted: false, membership: { businessId: member.businessId, userId, role: member.role, joinedAt: member.createdAt } };
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

