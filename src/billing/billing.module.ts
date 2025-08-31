import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { Business } from '../business/registration/business.entity';
import { Billing } from './billing.entity';
import { BillingItem } from './billing.item.entity';
import { MbmbModule } from '../mbmb/mbmb.module';

@Module({
  imports: [TypeOrmModule.forFeature([Business, Billing, BillingItem]), MbmbModule],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule { }
