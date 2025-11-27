import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ReviewWorkflowService } from './review-workflow.service';
import { UpdateModuleWorkflowDto } from './dto/update-workflow.dto';

@ApiTags('Review Workflow')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('review-workflow')
export class ReviewWorkflowController {
    constructor(private readonly service: ReviewWorkflowService) { }

    @Get(':module')
    @Roles('admin', 'superadmin')
    async getModule(@Param('module') module: string) {
        return this.service.getModuleWorkflow(module);
    }

    @Put(':module')
    @Roles('admin', 'superadmin')
    async update(@Param('module') module: string, @Body() dto: UpdateModuleWorkflowDto) {
        return this.service.updateModuleWorkflow(module, dto);
    }
}
