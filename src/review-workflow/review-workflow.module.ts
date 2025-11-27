import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewWorkflowStage, ReviewWorkflowStageMember } from './review-workflow.entity';
import { ReviewWorkflowService } from './review-workflow.service';
import { ReviewWorkflowController } from './review-workflow.controller';
import { User } from '../users/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ReviewWorkflowStage, ReviewWorkflowStageMember, User])],
    providers: [ReviewWorkflowService],
    controllers: [ReviewWorkflowController],
    exports: [ReviewWorkflowService],
})
export class ReviewWorkflowModule { }
