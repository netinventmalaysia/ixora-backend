import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MbmbService } from './mbmb.service';
import { MbmbController } from './mbmb.controller';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        baseURL: config.get('MBMB_API_BASE') || 'https://api.mbmb.gov.my',
        timeout: 10000,
      }),
    }),
  ],
  providers: [MbmbService],
  controllers: [MbmbController],
  exports: [MbmbService],
})
export class MbmbModule {}
