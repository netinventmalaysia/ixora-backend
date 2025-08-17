import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Req,
    UseGuards,
    NotFoundException,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { TeamService } from './team.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';

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
}
