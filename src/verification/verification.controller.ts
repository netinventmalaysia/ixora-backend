import { Body, Controller, Get, NotFoundException, Param, Patch } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { VerificationStatus } from './document-verification.entity';

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
}
