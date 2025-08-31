import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadsController } from './uploads.controller';
import { UploadsEntity } from './uploads.entity';
import { UploadsService } from './uploads.service';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([UploadsEntity])],
  providers: [UploadsService],
  controllers: [UploadsController]
})
export class UploadsModule { }
