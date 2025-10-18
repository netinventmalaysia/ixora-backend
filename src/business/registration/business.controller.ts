import { Controller, Post, Body, Get, Req, UseGuards, Param, Put, Patch, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/users/user.entity';

@ApiTags('Business')
@ApiBearerAuth('bearer')
@Controller('business')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BusinessController {
    constructor(private readonly businessService: BusinessService) { }

    @Post()
    @Roles('business', 'personal')
    async register(@Req() req: any, @Body() dto: CreateBusinessDto) {
        const userId = req.user.userId;
        console.log('Registering business for user ID:', userId);
        console.log('Business data:', dto);
        return this.businessService.create({ ...dto, userId });
    }

    @Get('/registered')
    @Roles('admin', 'business', 'personal')
    async getMyBusinesses(@Req() req: any) {
        const userId = req.user.id;
        return this.businessService.findAllMappedByUser(userId);
    }

    // Admin: list businesses by LAM status for approvals
    @Get('lam')
    @Roles('admin', 'superadmin')
    async listLam(@Req() req: any) {
        const { status = 'Pending', limit = '50', offset = '0' } = req.query || {};
        const take = Math.min(Math.max(parseInt(String(limit), 10) || 50, 1), 100);
        const skip = Math.max(parseInt(String(offset), 10) || 0, 0);
        return this.businessService.listByLamStatus(String(status), take, skip);
    }

    @Get(':id')
    @Roles('admin', 'business', 'personal')
    async getBusinessById(@Param('id', ParseIntPipe) id: number) {
        const data = await this.businessService.findById(id);
        return data;
    }

    @Put(':id')
    @Roles('admin', 'business', 'personal')
    async updateBusiness(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateBusinessDto) {
        return this.businessService.update(id, dto);
    }

    @Patch(':id/status')
    @Roles('admin', 'business')
    async withdrawBusiness(@Param('id', ParseIntPipe) id: number, @Body('status') status: string) {
        return this.businessService.updateStatus(id, status);
    }

    // Submit LAM registration number + document (business side)
    @Post(':id/lam')
    @Roles('business')
    async submitLam(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { lamNumber: string; lamDocumentPath: string }
    ) {
        return this.businessService.submitLam(id, body);
    }

    // Admin approve/reject LAM and upgrade user role to consultant
    @Patch(':id/lam/verify')
    @Roles('admin', 'superadmin')
    async verifyLam(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { status: 'Approved' | 'Rejected'; reason?: string }
    ) {
        return this.businessService.verifyLam(id, body.status, body.reason);
    }
}
