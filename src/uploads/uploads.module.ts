import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadsController } from './uploads.controller';
import { UploadsEntity } from './uploads.entity';
import { UploadsService } from './uploads.service';
import { ConfigModule } from '@nestjs/config';
import { VerificationModule } from '../verification/verification.module';
@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([UploadsEntity]), VerificationModule],
  providers: [UploadsService],
  controllers: [UploadsController]
})
export class UploadsModule { }
