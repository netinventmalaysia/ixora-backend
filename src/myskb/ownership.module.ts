import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MySkbOwnership } from './ownership.entity';
import { MySkbOwnershipService } from './ownership.service';
import { MySkbOwnershipController } from './ownership.controller';
import { User } from '../users/user.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [TypeOrmModule.forFeature([MySkbOwnership, User]), MailModule],
  controllers: [MySkbOwnershipController],
  providers: [MySkbOwnershipService],
  exports: [MySkbOwnershipService],
})
export class MySkbOwnershipModule { }
