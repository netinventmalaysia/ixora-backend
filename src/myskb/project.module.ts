import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MySkbProject } from './project.entity';
import { Business } from '../business/registration/business.entity';
import { MySkbProjectOwner } from './project-owner.entity';
import { MySkbProjectService } from './project.service';
import { MySkbProjectController } from './project.controller';
import { MySkbOwnership } from './ownership.entity';
import { ReviewWorkflowModule } from '../review-workflow/review-workflow.module';
import { MailModule } from '../mail/mail.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([MySkbProject, MySkbProjectOwner, Business, MySkbOwnership]),
        ReviewWorkflowModule,
        MailModule,
    ],
    providers: [MySkbProjectService],
    controllers: [MySkbProjectController],
    exports: [MySkbProjectService],
})
export class MySkbProjectModule { }
