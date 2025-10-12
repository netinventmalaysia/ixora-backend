import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Req,
    Res,
    UseGuards,
    NotFoundException,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TeamService } from './team.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Public } from 'src/common/decorators/public.decorator';
import { Response } from 'express';

@ApiTags('Team')
@ApiBearerAuth('bearer')
@Controller('business')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeamController {
    private readonly logger = new Logger(TeamController.name);
    constructor(private readonly teamService: TeamService) { }

    @Get(':businessId/team')
    @Roles('business', 'admin', 'personal')
    async getTeam(@Param('businessId') businessId: number) {
        return this.teamService.getTeamByBusinessId(+businessId);
    }

    @Post(':businessId/team/invite')
    @Roles('business', 'admin', 'personal')
    async inviteMember(
        @Param('businessId') businessId: number,
        @Body('email') email: string,
        @Req() req: any
    ) {
        const inviterId = req.user?.userId ?? req.user?.sub ?? req.user?.id ?? null;
        return this.teamService.inviteMember(+businessId, email, inviterId);
    }

    @Patch('team/:memberId/role')
    @Roles('business', 'admin', 'personal')
    async assignRole(
        @Param('memberId') memberId: number,
        @Body('role') role: string
    ) {
        return this.teamService.updateMemberRole(+memberId, role);
    }

    @Delete('team/:memberId')
    @Roles('business', 'admin', 'personal')
    async removeMember(@Param('memberId') memberId: number) {
        return this.teamService.removeMember(+memberId);
    }

    @Get('/invite/validate')
    async validateInvite(@Body() body: any, @Param() params: any, @Req() req: any) {
        const token = req.query.token as string;
        return this.teamService.validateInvite(token);
    }

    @Post('/invite/accept')
    async acceptInvite(@Body('token') token: string, @Req() req: any) {
        // log authenticated user for debugging
        this.logger.debug(`acceptInvite req.user: ${JSON.stringify(req.user ?? {})}`);
        // extract user id from common JWT claim names
        const userId = req.user?.userId ?? req.user?.sub ?? req.user?.id ?? null;
        if (!userId) {
            // Build full-domain login URL (use FRONTEND_URL if set)
            const frontend = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
            const loginUrl = frontend
                ? `${frontend}/?redirect=${encodeURIComponent(`/business-invite?token=${token}`)}`
                : `/?redirect=${encodeURIComponent(`/business-invite?token=${token}`)}`;
            throw new UnauthorizedException({ error: 'unauthenticated', loginUrl });
        }

        return this.teamService.acceptInvite(token, userId);
    }

    @Post('/owner/approve-duplicate')
    async approveDuplicate(@Body('token') token: string, @Req() req: any) {
        const ownerId = req.user?.userId ?? req.user?.sub ?? req.user?.id ?? null;
        if (!ownerId) {
            throw new UnauthorizedException({ error: 'unauthenticated' });
        }
        return this.teamService.approveDuplicateRequest(token, ownerId);
    }

    @Post('/owner/decline-duplicate')
    async declineDuplicate(@Body('token') token: string, @Req() req: any) {
        const ownerId = req.user?.userId ?? req.user?.sub ?? req.user?.id ?? null;
        if (!ownerId) {
            throw new UnauthorizedException({ error: 'unauthenticated' });
        }
        return this.teamService.declineDuplicateRequest(token, ownerId);
    }

    @Post('/owner/resend-duplicate')
    async resendDuplicate(@Body() body: { businessId: number; requesterEmail: string }, @Req() req: any) {
        const ownerId = req.user?.userId ?? req.user?.sub ?? req.user?.id ?? null;
        if (!ownerId) {
            throw new UnauthorizedException({ error: 'unauthenticated' });
        }
        return this.teamService.resendDuplicateRequest(body.businessId, body.requesterEmail, ownerId);
    }

    // Public GET endpoints for email links: perform action then redirect to frontend confirmation page
    @Public()
    @Get('/owner/approve-duplicate')
    async approveDuplicateGet(@Req() req: any, @Res() res: Response) {
        const token = req.query.token as string;
        // Owner identity cannot be inferred from JWT (public), so we infer by business owner from token
        // TeamService will validate ownership from token.business.userId
        const result = await this.teamService.approveDuplicateRequestPublic(token);
        const frontend = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
        const redirectUrl = `${frontend || ''}/business-owner-approval-result?status=${result.success ? 'approved' : 'error'}&code=${encodeURIComponent(result.error || '')}`;
        return res.redirect(302, redirectUrl);
    }

    @Public()
    @Get('/owner/decline-duplicate')
    async declineDuplicateGet(@Req() req: any, @Res() res: Response) {
        const token = req.query.token as string;
        const result = await this.teamService.declineDuplicateRequestPublic(token);
        const frontend = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
        const redirectUrl = `${frontend || ''}/business-owner-approval-result?status=${result.success ? 'declined' : 'error'}&code=${encodeURIComponent(result.error || '')}`;
        return res.redirect(302, redirectUrl);
    }
}
