import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamMember } from './team-member.entity';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import { MailModule } from 'src/mail/mail.module';
import { BusinessModule } from '../registration/business.module';
import { Business } from '../registration/business.entity';
@Module({
    imports: [TypeOrmModule.forFeature([TeamMember, Business]), MailModule, BusinessModule],
    providers: [TeamService],
    controllers: [TeamController],
})
export class TeamModule { }