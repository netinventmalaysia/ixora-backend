import { Body, Controller, Get, NotFoundException, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { VerificationStatus } from './document-verification.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get('business/:id/latest')
  async getLatestForBusiness(@Param('id') id: string) {
    const businessId = parseInt(id, 10);
    const v = await this.verificationService.findLatestByBusinessId(businessId);
    if (!v) throw new NotFoundException('No verification found');
    return v;
  }

  @Patch(':id/review')
  async review(
    @Param('id') id: string,
    @Body('status') status: VerificationStatus,
    @Body('reason') reason?: string,
  ) {
    const vid = parseInt(id, 10);
    return this.verificationService.manualReview(vid, status, reason);
  }

  @Patch(':id/process')
  async process(@Param('id') id: string) {
    const vid = parseInt(id, 10);
    const v = await this.verificationService.processVerification(vid);
    if (!v) throw new NotFoundException('Verification not found');
    return v;
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async listPending(
    @Query('status') status?: VerificationStatus | VerificationStatus[],
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const statuses = Array.isArray(status) ? status : status ? [status] : undefined;
    const take = limit ? parseInt(limit, 10) : undefined;
    const skip = offset ? parseInt(offset, 10) : undefined;
    return this.verificationService.listPending({ statuses, limit: take, offset: skip });
  }
}
