import { Body, Controller, Get, Param, Post, Put, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpsertDraftDto, SubmitProjectDto, ListDraftsQueryDto, ListProjectsQueryDto, SubmitDraftByIdDto } from './dto/project.dto';
import { MySkbProjectService } from './project.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('MySKB Project')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('myskb/project')
export class MySkbProjectController {
    constructor(private readonly service: MySkbProjectService) { }

    @Post('draft')
    async saveDraft(@Body() dto: UpsertDraftDto, @Req() req: any) {
        console.log('Saving draft for business ID save as draft:', dto.business_id);
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
        console.log('Updating draft for business ID for draft ID:', dto.business_id);
        const userId: number = req.user?.userId || req.user?.id;
        const saved = await this.service.asAsDraft(parseInt(id, 10), dto.business_id, userId, dto.data);
        return { id: saved.id, status: saved.status, updated_at: saved.updatedAt };
    }

    // Get all projects by viewer
    @Get()
    async list(@Query() query: ListProjectsQueryDto, @Req() req: any) {
        const { limit = 20, offset = 0, viewerUserId, businessId, status } = query;
        console.log('businessId:', businessId);
        const fallbackUserId: number | undefined = req.user?.userId || req.user?.id || req.user?.sub;
        const effectiveViewer = viewerUserId ?? fallbackUserId;
        const result = await this.service.list(Number(effectiveViewer), limit, offset, businessId, status as any);
        return result;
    }

    // ============== Admin endpoints ==============
    // List projects for admin by status (e.g., submitted)
    @Get('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async adminList(
        @Query('status') status?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        const lim = limit ? parseInt(limit, 10) : 20;
        const off = offset ? parseInt(offset, 10) : 0;
        return this.service.adminList(status as any, lim, off);
    }

    // Admin detail view: fetch any project by id with owners and business info
    @Get('admin/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async adminGetOne(@Param('id') id: string) {
        return this.service.getByIdWithOwners(Number(id));
    }

    // Review a submitted project: approve or reject with optional reason
    @Patch(':id/review')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async review(
        @Param('id') id: string,
        @Body('status') status: 'Approved' | 'Rejected' | 'approved' | 'rejected',
        @Body('reason') reason: string | undefined,
        @Req() req: any,
    ) {
        const reviewerId: number = req.user?.userId || req.user?.id || req.user?.sub;
        return this.service.review(parseInt(id, 10), reviewerId, status as any, reason);
    }

    // Get a single project by id (includes owners with user name and ownership type)
    @Get(':id')
    async getOne(
        @Param('id') id: string,
        @Req() req: any,
        @Query('viewerUserId') viewerUserId?: string,
        @Query('businessId') businessId?: number,
        @Query('status') status?: string,
    ) {
        const jwtViewer: number | undefined = req.user?.userId || req.user?.id || req.user?.sub;
        const viewerId = (viewerUserId !== undefined && viewerUserId !== null) ? Number(viewerUserId) : jwtViewer;
        const result = await this.service.getByIdWithOwners(Number(id), viewerId, businessId);
        return result;
    }
}
