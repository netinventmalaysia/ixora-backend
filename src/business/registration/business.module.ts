import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from './business.entity';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { UploadsEntity } from '../../uploads/uploads.entity';
import { VerificationModule } from '../../verification/verification.module';

@Module({
    imports: [TypeOrmModule.forFeature([Business, UploadsEntity]), VerificationModule],
    providers: [BusinessService],
    controllers: [BusinessController],
    exports: [BusinessService],
})
export class BusinessModule { }
