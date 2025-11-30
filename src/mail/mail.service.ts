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
        context: { businessName: string; registrationNumber: string; requesterEmail: string; approveUrl: string; declineUrl?: string }
    ) {
        const { businessName, registrationNumber, requesterEmail, approveUrl, declineUrl } = context;
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
                    <a href="${approveUrl}" target="_blank" rel="noopener noreferrer" style="margin-right:12px;">Approve Request</a>
                    ${declineUrl ? `<a href="${declineUrl}" target="_blank" rel="noopener noreferrer" style="color:#b00020">Decline</a>` : ''}
                </p>
                <p>If you did not initiate this, you can ignore this email.</p>
                <p>Thank you,<br/>MBMB Team</p>
            `,
        });
    }

    async sendDuplicateRequestApprovedEmail(
        requesterEmail: string,
        context: { businessName: string }
    ) {
        const { businessName } = context;
        return this.mailerService.sendMail({
            to: requesterEmail,
            subject: 'Ixora: Access Approved',
            html: `
                <h3>Congratulations</h3>
                <p>Your request to join <strong>${businessName}</strong> has been approved. You now have staff access.</p>
                <p>Thank you,<br/>MBMB Team</p>
            `,
        });
    }

    async sendDuplicateRequestDeclinedEmail(
        requesterEmail: string,
        context: { businessName: string }
    ) {
        const { businessName } = context;
        return this.mailerService.sendMail({
            to: requesterEmail,
            subject: 'Ixora: Access Declined',
            html: `
                <h3>Request Declined</h3>
                <p>Your request to join <strong>${businessName}</strong> was declined by the owner.</p>
                <p>If you believe this is an error, please contact the MBMB support team.</p>
                <p>Thank you,<br/>MBMB Team</p>
            `,
        });
    }

    // LAM: Submission acknowledgement to business owner
    async sendLamSubmissionReceivedEmail(email: string, context: { businessName: string; lamNumber?: string }) {
        const { businessName, lamNumber } = context || {} as any;
        return this.mailerService.sendMail({
            to: email,
            subject: 'Ixora MBMB: LAM Submission Received',
            html: `
                <h3>LAM Submission Received</h3>
                <p>We have received your LAM details for the business <strong>${businessName || 'your business'}</strong>.</p>
                ${lamNumber ? `<p><strong>LAM No.:</strong> ${lamNumber}</p>` : ''}
                <p>Your application is now in review. We will notify you via email once a decision has been made (Approved or Rejected).</p>
                <p>Thank you,<br/>MBMB Team</p>
            `,
        });
    }

    // LAM: Final decision to business owner
    async sendLamVerificationResultEmail(email: string, context: { businessName: string; status: 'Approved' | 'Rejected'; reason?: string }) {
        const { businessName, status, reason } = context || {} as any;
        const title = status === 'Approved' ? 'LAM Approved' : 'LAM Rejected';
        const reasonHtml = status === 'Rejected' && reason ? `<p><strong>Reason:</strong> ${reason}</p>` : '';
        return this.mailerService.sendMail({
            to: email,
            subject: `Ixora MBMB: ${title}`,
            html: `
                <h3>${title}</h3>
                <p>Business: <strong>${businessName || 'your business'}</strong></p>
                ${reasonHtml}
                <p>Thank you,<br/>MBMB Team</p>
            `,
        });
    }

    async sendMySkbFinalApprovalRequest(
        email: string,
        context: { projectId: number; projectTitle?: string; reviewUrl?: string }
    ) {
        const { projectId, projectTitle, reviewUrl } = context || {} as any;
        const linkHtml = reviewUrl
            ? `<p><a href="${reviewUrl}" target="_blank" rel="noopener noreferrer">Open project review</a></p>`
            : '';
        return this.mailerService.sendMail({
            to: email,
            subject: 'Ixora MBMB: MySKB final approval required',
            html: `
                <h3>Final Approval Required</h3>
                <p>The MySKB project <strong>${projectTitle || `#${projectId}`}</strong> has completed the processing-fee payment.</p>
                <p>Please review and record the final decision so that the permit payment request can be issued.</p>
                ${linkHtml}
                <p>Project ID: <strong>${projectId}</strong></p>
                <p>Thank you,<br/>MBMB Team</p>
            `,
        });
    }
}
