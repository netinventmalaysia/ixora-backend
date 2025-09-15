import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentVerification } from './document-verification.entity';
import { VerificationService } from './verification.service';
import { Business } from '../business/registration/business.entity';
import { UploadsEntity } from '../uploads/uploads.entity';
import { VerificationController } from './verification.controller';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [ConfigModule, MailModule, TypeOrmModule.forFeature([DocumentVerification, Business, UploadsEntity])],
  providers: [VerificationService],
  controllers: [VerificationController],
  exports: [VerificationService],
})
export class VerificationModule { }
