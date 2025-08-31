import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { Business } from '../business/registration/business.entity';
import { MbmbModule } from '../mbmb/mbmb.module';

@Module({
  imports: [TypeOrmModule.forFeature([Business]), MbmbModule],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
