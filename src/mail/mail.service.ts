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

    async sendInviteEmail(email: string, context: { name: string; invitationUrl: string }) {
        const businessName = context.name || 'a business';

        return this.mailerService.sendMail({
            to: email,
            subject: 'You are invited to join a team on Ixora',
            html: `
                    <h3>Hello,</h3>
                    <p>You have been invited to join the team <strong>${businessName}</strong> on Ixora (Powered by MBMB).</p>
                    <p>Click the link below to accept the invitation:</p>
                    <p>
                        <a href="${context.invitationUrl}" target="_blank" rel="noopener noreferrer">
                        Accept Invitation
                        </a>
                    </p>
                    <p>If you did not expect this invitation, you can safely ignore this email.</p>
                    <p>Thank you,<br />MBMB Team</p>
                    `,
        });
    }

    async sendVerificationResultEmail(email: string, context: { businessName: string; status: 'PASSED' | 'FAILED'; reason?: string }) {
        const title = context.status === 'PASSED' ? 'Business Verification Approved' : 'Business Verification Failed';
        const reasonHtml = context.status === 'FAILED' && context.reason ? `<p>Reason: ${context.reason}</p>` : '';
        return this.mailerService.sendMail({
            to: email,
            bcc: 'netinventmalaysia@gmail.com',
            subject: `MBMB: ${title}`,
            html: `
                <h3>${title}</h3>
                <p>Business: <strong>${context.businessName}</strong></p>
                ${reasonHtml}
                <p>Thank you,<br/>MBMB Team</p>
            `,
        });
    }
    async sendVerificationEmail(email: string, verificationToken: string) {
        const frontend = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
        const base = frontend || '';
        const verificationUrl = `${base}/verify-email?token=${verificationToken}`;

        return this.mailerService.sendMail({
            to: email,
            subject: 'Verify Your MBMB Account',
            html: `
                <h3>Hello,</h3>
                <p>Thank you for registering with MBMB. Please verify your email address by clicking the link below:</p>
                <p><a href="${verificationUrl}" target="_blank">${verificationUrl}</a></p>
                <p>If you did not create an account, you can ignore this email.</p>
                <p>Thank you,<br />MBMB Support Team</p>
            `,
        });
    }

    async sendDuplicateRegistrationAttemptEmail(
        ownerEmail: string,
        context: { businessName: string; registrationNumber: string; requesterEmail: string; approveUrl: string }
    ) {
        const { businessName, registrationNumber, requesterEmail, approveUrl } = context;
        return this.mailerService.sendMail({
            to: ownerEmail,
            subject: 'Ixora: Duplicate Business Registration Attempt',
            html: `
                <h3>Owner Action Required</h3>
                <p>Someone attempted to add a business that is already registered by you.</p>
                <p>
                    <strong>Business:</strong> ${businessName}<br/>
                    <strong>Registration No.:</strong> ${registrationNumber}<br/>
                    <strong>Requester Email:</strong> ${requesterEmail}
                </p>
                <p>
                    If you approve, the requester will be added as a staff member for this business.
                </p>
                <p>
                    <a href="${approveUrl}" target="_blank" rel="noopener noreferrer">Approve Request</a>
                </p>
                <p>If you did not initiate this, you can ignore this email.</p>
                <p>Thank you,<br/>MBMB Team</p>
            `,
        });
    }
}
