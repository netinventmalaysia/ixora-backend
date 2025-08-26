// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadsModule } from './uploads/uploads.module';
import { UserModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { BusinessModule } from './business/registration/business.module';
import { SftpModule } from './sftp/sftp.module';
import { TeamModule } from './business/team/team.module';
import { HooksModule } from './hooks/hooks.module';
import { MbmbModule } from './mbmb/mbmb.module';

@Module({
  imports: [UploadsModule, UserModule, AuthModule, MailModule, BusinessModule, SftpModule, TeamModule, HooksModule, MbmbModule,

    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mariadb',
        host: config.get('DB_HOST'),
        port: parseInt(config.get('DB_PORT') || '3306', 10),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
  ],
})
export class AppModule { }
