import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import { VerificationStatus } from './document-verification.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Verification')
@ApiBearerAuth('bearer')
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
    // Allow friendly aliases like "approved" -> PASSED, "rejected" -> FAILED
    const raw = (status as unknown as string) || '';
    const key = raw.toString().trim().toUpperCase();
    const map: Record<string, VerificationStatus> = {
      PASSED: VerificationStatus.PASSED,
      APPROVED: VerificationStatus.PASSED,
      APPROVE: VerificationStatus.PASSED,
      PASS: VerificationStatus.PASSED,
      FAILED: VerificationStatus.FAILED,
      REJECTED: VerificationStatus.FAILED,
      REJECT: VerificationStatus.FAILED,
      FAIL: VerificationStatus.FAILED,
      NEEDS_REVIEW: VerificationStatus.NEEDS_REVIEW,
      REVIEW: VerificationStatus.NEEDS_REVIEW,
      PENDING: VerificationStatus.PENDING,
    };
    const mapped = map[key];
    if (!mapped) {
      throw new BadRequestException('Invalid status. Use: approved, rejected, review, pending, passed, failed');
    }
    const result = await this.verificationService.manualReview(vid, mapped, reason);
    if (!result) throw new NotFoundException('Verification not found');
    return result;
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
