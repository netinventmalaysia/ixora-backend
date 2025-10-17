import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpsertDraftDto, SubmitProjectDto, ListDraftsQueryDto, ListProjectsQueryDto, SubmitDraftByIdDto } from './dto/project.dto';
import { MySkbProjectService } from './project.service';

@ApiTags('MySKB Project')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('myskb/project')
export class MySkbProjectController {
    constructor(private readonly service: MySkbProjectService) { }

    @Post('draft')
    async saveDraft(@Body() dto: UpsertDraftDto, @Req() req: any) {
        const userId: number = req.user?.userId || req.user?.id; // depending on jwt payload
        const draft = await this.service.upsertDraft(dto.business_id, userId, dto.data);
        return { id: draft.id, status: draft.status, updated_at: draft.updatedAt };
    }

    @Post('submit')
    async submit(@Body() dto: SubmitProjectDto, @Req() req: any) {
        const userId: number = req.user?.userId || req.user?.id;
        const created = await this.service.submit(dto.business_id, userId, dto.owners_user_ids, dto.data);
        return { id: created.id, status: created.status };
    }

    // Update an existing draft by id
    @Put('draft/:id')
    async updateDraft(@Param('id') id: string, @Body() dto: UpsertDraftDto, @Req() req: any) {
        const userId: number = req.user?.userId || req.user?.id;
        const saved = await this.service.asAsDraft(parseInt(id, 10), dto.business_id, userId, dto.data);
        return { id: saved.id, status: saved.status, updated_at: saved.updatedAt };
    }

    // Get all projects by viewer
    @Get()
    async list(@Query() query: ListProjectsQueryDto, @Req() req: any) {
        const { limit = 20, offset = 0, viewerUserId, status } = query;
        const result = await this.service.list(viewerUserId, limit, offset);
        return result;
    }
}
