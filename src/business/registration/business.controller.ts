import { Controller, Post, Body, Get, Req, UseGuards, Param } from '@nestjs/common';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

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
}


