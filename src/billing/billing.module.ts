import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { Business } from '../business/registration/business.entity';
import { Billing } from './billing.entity';
import { BillingItem } from './billing.item.entity';
import { Payment } from './payment.entity';
import { MbmbModule } from '../mbmb/mbmb.module';
import { MySkbProjectModule } from '../myskb/project.module';

@Module({
  imports: [TypeOrmModule.forFeature([Business, Billing, BillingItem, Payment]), MbmbModule, MySkbProjectModule],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule { }
