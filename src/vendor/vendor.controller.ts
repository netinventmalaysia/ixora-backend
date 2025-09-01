import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { VendorService } from './vendor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('vendors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class VendorController {
  constructor(private readonly service: VendorService) {}

  @Get('generate-key')
  async generateKey() {
    return this.service.generateKey();
  }

  @Post()
  async createVendor(@Body() body: { name: string; key: string; app_name: string }) {
    return this.service.createVendor(body);
  }

  @Get()
  async list() {
    return this.service.list();
  }
}
