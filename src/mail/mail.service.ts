import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
    constructor(private mailerService: MailerService) { }

    async sendTestEmail(email: string) {
        return this.mailerService.sendMail({
            to: email,
            subject: 'MBMB Test Email',
            html: `<h3>This is a test email from MBMB NestJS system.</h3>`,
        });
    }
}