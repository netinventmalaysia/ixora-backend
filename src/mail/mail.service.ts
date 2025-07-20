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

    async sendPasswordResetEmail(email: string, resetUrl: string) {
        return this.mailerService.sendMail({
            to: email,
            subject: 'Reset Your MBMB Password',
            html: `
        <h3>Hello,</h3>
        <p>We received a request to reset your password for your MBMB account.</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetUrl}" target="_blank">${resetUrl}</a></p>
        <p>If you did not request this, you can safely ignore this email.</p>
        <p>Thank you,<br />MBMB Support Team</p>
      `,
        });
    }

    async sendInviteEmail(email: string, context: { name: string; businessId: number }) {
        const businessName = context.name || 'a business';
        const businessId = context.businessId;

        return this.mailerService.sendMail({
            to: email,
            subject: 'You are invited to join a team on Ixora',
            html: `
                    <h3>Hello,</h3>
                    <p>You have been invited to join the team <strong>${businessName}</strong> on Ixora (Powered by MBMB).</p>
                    <p>Click the link below to accept the invitation:</p>
                    <p>
                        <a href="https://mbmb.com/accept-invite?businessId=${businessId}" target="_blank" rel="noopener noreferrer">
                        Accept Invitation
                        </a>
                    </p>
                    <p>If you did not expect this invitation, you can safely ignore this email.</p>
                    <p>Thank you,<br />MBMB Team</p>
                    `,
        });
    }
}
