import { Controller, Post, Body, Get, Req, UseGuards, Param, Put, Patch } from '@nestjs/common';
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

    @Get(':id')
    @Roles('admin', 'business', 'personal')
    async getBusinessById(@Param('id') id: string) {
        // If your service expects a number:
        const businessId = parseInt(id, 10);
        const data = await this.businessService.findById(businessId);
        return data;
    }

    @Put(':id')
    @Roles('admin', 'business', 'personal')
    async updateBusiness(@Param('id') id: string, @Body() dto: CreateBusinessDto) {
        const businessId = parseInt(id, 10);
        return this.businessService.update(businessId, dto);
    }

    @Patch(':id/status')
    @Roles('admin', 'business')
    async withdrawBusiness(@Param('id') id: string, @Body('status') status: string) {
        const businessId = parseInt(id, 10);
        return this.businessService.updateStatus(businessId, status);
    }

    // Submit LAM registration number + document (business side)
    @Post(':id/lam')
    @Roles('business')
    async submitLam(
        @Param('id') id: string,
        @Body() body: { lamNumber: string; lamDocumentPath: string }
    ) {
        const businessId = parseInt(id, 10);
        return this.businessService.submitLam(businessId, body);
    }

    // Admin approve/reject LAM and upgrade user role to consultant
    @Patch(':id/lam/verify')
    @Roles('admin', 'superadmin')
    async verifyLam(
        @Param('id') id: string,
        @Body() body: { status: 'Approved' | 'Rejected'; reason?: string }
    ) {
        const businessId = parseInt(id, 10);
        return this.businessService.verifyLam(businessId, body.status, body.reason);
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
}
