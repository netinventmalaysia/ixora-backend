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
        if (dto.draft_id) {
            const saved = await this.service.submitDraftById(Number(dto.draft_id), dto.business_id, userId, dto.data);
            return { id: saved.id, status: saved.status };
        }
        const created = await this.service.submit(dto.business_id, userId, dto.data, dto.useDraft);
        return { id: created.id, status: created.status };
    }

    // Update an existing draft by id
    @Put('draft/:id')
    async updateDraft(@Param('id') id: string, @Body() dto: UpsertDraftDto, @Req() req: any) {
        const userId: number = req.user?.userId || req.user?.id;
        const saved = await this.service.updateDraftById(parseInt(id, 10), dto.business_id, userId, dto.data);
        return { id: saved.id, status: saved.status, updated_at: saved.updatedAt };
    }

    // Submit an existing draft by id (optionally save latest data first)
    @Post('draft/:id/submit')
    async submitDraft(@Param('id') id: string, @Body() dto: SubmitDraftByIdDto, @Req() req: any) {
        const userId: number = req.user?.userId || req.user?.id;
        const saved = await this.service.submitDraftById(parseInt(id, 10), dto.business_id, userId, dto.data);
        return { id: saved.id, status: saved.status };
    }

    @Get('latest')
    async latest(@Req() req: any) {
        const userId: number = req.user?.userId || req.user?.id;
        const businessId = Number(req.query.business_id || req.query.businessId);
        const res = await this.service.latest(businessId, userId);
        return res ? { id: res.id, status: res.status, updated_at: res.updatedAt } : null;
    }

    // Primary: GET /myskb/project/draft
    @Get('draft')
    async listDrafts(@Query() q: ListDraftsQueryDto, @Req() req: any) {
        const userId: number = req.user?.userId || req.user?.id;
        const { limit = 20, offset = 0, business_id } = q;
        const result = await this.service.listDrafts(userId, limit, offset, business_id);
        return result;
    }

    // Fallback: GET /myskb/project?status=Draft
    @Get()
    async list(@Query() q: ListProjectsQueryDto, @Req() req: any) {
        const userId: number = req.user?.userId || req.user?.id;
        const { limit = 20, offset = 0, business_id, status } = q;
        const normalizedStatus = status as any; // DTO restricts to 'draft' | 'submitted'
        const result = await this.service.list(userId, normalizedStatus, limit, offset, business_id);
        return result;
    }
}
