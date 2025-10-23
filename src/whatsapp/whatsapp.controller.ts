import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly wa: WhatsappService) {}

  // Public: request OTP for registration
  @Post('otp/request')
  async requestOtp(@Body('phone') phone: string, @Body('purpose') purpose?: 'registration' | 'login' | 'reset_password') {
    return this.wa.requestOtp(phone, purpose || 'registration');
  }

  // Public: verify OTP
  @Post('otp/verify')
  async verifyOtp(@Body('phone') phone: string, @Body('code') code: string, @Body('purpose') purpose?: 'registration' | 'login' | 'reset_password') {
    return this.wa.verifyOtp(phone, code, purpose || 'registration');
  }

  // Webhook verification (GET) and receiver (POST)
  @Get('webhook')
  async verifyWebhook(@Query('hub.mode') mode: string, @Query('hub.verify_token') token: string, @Query('hub.challenge') challenge: string, @Res() res: any) {
    const expected = process.env.WA_VERIFY_TOKEN || 'ixora-wa-verify';
    if (mode === 'subscribe' && token === expected) {
      return res.status(200).send(challenge || 'OK');
    }
    return res.status(403).send('Forbidden');
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Req() req: any) {
    // For now, acknowledge. Could store delivery statuses if needed.
    return { status: 'ok' };
  }
}
