import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from './business.entity';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { UploadsEntity } from '../../uploads/uploads.entity';
import { VerificationModule } from '../../verification/verification.module';
import { TeamMember } from '../team/team-member.entity';
import { User } from 'src/users/user.entity';
import { MailService } from 'src/mail/mail.service';

@Module({
    imports: [TypeOrmModule.forFeature([Business, UploadsEntity, TeamMember, User]), VerificationModule],
    providers: [BusinessService, MailService],
    controllers: [BusinessController],
    exports: [BusinessService],
})
export class BusinessModule { }
