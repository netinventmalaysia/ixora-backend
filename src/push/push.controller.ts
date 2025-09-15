import { Body, Controller, Delete, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PushService } from './push.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Push')
@Controller('push')
export class PushController {
  constructor(private readonly service: PushService) {}

  // Public: fetch VAPID public key
  @Get('public-key')
  publicKey() {
    return this.service.getPublicKey();
  }

  // Authenticated: save/update subscription
  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard)
  @Post('subscription')
  async upsert(@Body() body: any, @Req() req: any) {
    const userId: number = req.user?.userId || req.user?.id;
    const { subscription, userAgent } = body || {};
    return this.service.upsertSubscription(userId, subscription, userAgent);
  }

  // Authenticated: delete subscription
  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard)
  @Delete('subscription')
  async remove(@Body() body: any, @Req() req: any) {
    const userId: number = req.user?.userId || req.user?.id;
    const { endpoint, id } = body || {};
    return this.service.removeSubscription(userId, endpoint, id);
  }

  // Admin-only: send test notification
  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('test')
  async test(@Body() body: any) {
    return this.service.sendTest(body || {});
  }

  // Admin-only: generate VAPID key pair (do not persist; copy to vault and set env vars)
  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('generate-keys')
  async generateKeys() {
    return this.service.generateVapidKeys();
  }
}
