import { Controller, Post, Get, Query, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';

@ApiTags('Hooks')
@Controller('hooks')
export class HooksController {
  constructor(private readonly config: ConfigService) {}

  @Post('ixora-backend')
  @Get('ixora-backend')
  trigger(@Query('token') token?: string) {
    const expected = this.config.get<string>('WEBHOOK_TOKEN');
    if (!expected || token !== expected) {
      throw new UnauthorizedException('Bad token');
    }

    return new Promise((resolve, reject) => {
      exec('/www/wwwroot/ixora/backend/deploy.sh', { timeout: 15 * 60 * 1000 }, (err, stdout, stderr) => {
        if (err) return reject(new InternalServerErrorException(stderr || err.message));
        resolve({ ok: true, output: stdout });
      });
    });
  }
}
