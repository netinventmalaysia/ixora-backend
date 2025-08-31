import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentVerification } from './document-verification.entity';
import { VerificationService } from './verification.service';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentVerification])],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
