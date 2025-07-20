import { Controller, Post, Body, Get, Req, UseGuards } from '@nestjs/common';
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
    async register(@Body() dto: CreateBusinessDto) {
        return this.businessService.create(dto);
    }
    @Get('/registered')
    @Roles('admin', 'business', 'personal')
    async getMyBusinesses(@Req() req: any) {
        const userId = req.user.id;
        return this.businessService.findAllMappedByUser(userId);
    }
}
