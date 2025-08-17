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
} from '@nestjs/common';
import { TeamService } from './team.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('business')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeamController {
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
        return this.teamService.inviteMember(+businessId, email, req.user.userId);
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
        // If user is not authenticated, return 401 with loginUrl
        if (!req.user) {
            return {
                statusCode: 401,
                error: 'unauthenticated',
                loginUrl: `/?return=${encodeURIComponent(`/business-invite?token=${token}`)}`,
            };
        }
        return this.teamService.acceptInvite(token, req.user.userId);
    }
}
