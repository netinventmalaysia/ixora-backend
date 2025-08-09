import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SftpService } from './sftp.service';

@Global()
@Module({
    imports: [ConfigModule], // ✅ If you use ConfigService inside SftpService
    providers: [SftpService],
    exports: [SftpService],
})
export class SftpModule { }