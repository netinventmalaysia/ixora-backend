import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TeamMember } from './team-member.entity';
import { Repository } from 'typeorm';
import { MailService } from 'src/mail/mail.service';
import { Business } from '../registration/business.entity';

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
        if (!business) throw new Error('Business not found');

        const member = this.teamRepo.create({
            businessId,
            email,
            role: 'business',
            invitedBy,
        });
        await this.teamRepo.save(member);

        await this.mailService.sendInviteEmail(email, {
            businessId,
            name: business.companyName,
        });

        return member;
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
