import { Injectable, UnauthorizedException, NotFoundException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../users/user.service';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { MailService } from '../mail/mail.service';
import { addMinutes } from 'date-fns';
import { User } from 'src/users/user.entity';

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService,
        private mailService: MailService,
    ) { }

    async validateUser(email: string, password: string) {
        const user = await this.userService.findByEmail(email);
        if (user && await bcrypt.compare(password, user.password)) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(email: string, password: string) {
        const user = await this.userService.findByEmail(email);
        if (!user) throw new UnauthorizedException('User not found');

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw new UnauthorizedException('Invalid credentials');

        // Block login if email is not verified; (re)send verification email
        if (!user.isEmailVerified) {
            try {
                const now = new Date();
                let token = user.verificationToken || '';
                const expired = !user.verificationTokenExpires || user.verificationTokenExpires < now;
                if (!token || expired) {
                    token = uuidv4();
                    user.verificationToken = token;
                    user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
                    await this.userService.save(user);
                }
                await this.mailService.sendVerificationEmail(user.email, token);
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error('[login] Failed to (re)send verification email:', e);
            }
            throw new UnauthorizedException('Email not verified. A new verification email has been sent.');
        }

        const payload = { sub: user.id, email: user.email, username: user.username, role: user.role };
        return {
            accessToken: this.jwtService.sign(payload),
            user,
        };
    }

    async logout() {
        return { message: 'Logged out successfully' };
    }

    async guestLogin() {
        const guestUser = {
            id: `guest-${uuidv4()}`,
            name: 'Guest User',
            username: `guest-${Date.now()}`,
            email: `guest-${Date.now()}@ixora.local`,
            role: 'guest',
        };

        const payload = {
            sub: guestUser.id,
            email: guestUser.email,
            role: guestUser.role,
        };

        return {
            accessToken: this.jwtService.sign(payload),
            user: guestUser,
        };
    }

    async requestPasswordReset(email: string) {
        const user = await this.userService.findByEmail(email);
        if (!user) return;

        const token = uuidv4();
        const expiry = addMinutes(new Date(), 15); // expires in 15 mins

        user.resetToken = token;
        user.resetTokenExpiry = expiry;
        await this.userService.save(user);

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
        await this.mailService.sendPasswordResetEmail(user.email, resetUrl);
    }

    async verifyResetToken(token: string): Promise<User> {
        const user = await this.userService.findByResetToken(token);
        if (!user) throw new UnauthorizedException('Invalid token');

        const now = new Date();
        if (!user.resetTokenExpiry || user.resetTokenExpiry < now) {
            throw new UnauthorizedException('Token expired');
        }

        return user;
    }

    async resetPassword(token: string, newPassword: string) {
        const user = await this.userService.findByResetToken(token);

        if (!user) {
            throw new BadRequestException('Invalid or expired reset token.');
        }

        const now = new Date();
        if (!user.resetTokenExpiry || user.resetTokenExpiry < now) {
            throw new BadRequestException('Reset token has expired.');
        }

        user.password = newPassword;
        user.resetToken = null;
        user.resetTokenExpiry = null;

        await this.userService.save(user);

        return { message: 'Password has been successfully reset.' };
    }

    async verifyEmail(token: string): Promise<User> {
        const user = await this.userService.findByVerificationToken(token);
        if (!user) throw new BadRequestException('Invalid verification token');
        const now = new Date();
        if (!user.verificationTokenExpires || user.verificationTokenExpires < now) {
            // Auto-resend a new verification email if expired
            try {
                const newToken = uuidv4();
                const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
                user.verificationToken = newToken;
                user.verificationTokenExpires = newExpiry;
                await this.userService.save(user);
                await this.mailService.sendVerificationEmail(user.email, newToken);
            } catch (e) {
                // Non-fatal for API response; still report expiration
                // eslint-disable-next-line no-console
                console.error('[verifyEmail] Failed to resend verification email:', e);
            }
            throw new HttpException('Verification token expired. A new verification email has been sent.', HttpStatus.GONE);
        }
        user.isEmailVerified = true;
        user.isAccountVerified = true;
        user.verificationToken = null;
        user.verificationTokenExpires = null as any;
        await this.userService.save(user);
        return user;
    }

    // Non-consuming validation for email verification token
    async validateEmailToken(token: string): Promise<{ userId: number; email: string; expiresAt: Date }> {
        const user = await this.userService.findByVerificationToken(token);
        if (!user) throw new NotFoundException('Invalid verification token');
        const now = new Date();
        if (!user.verificationTokenExpires || user.verificationTokenExpires < now) {
            // Optionally resend a new email here, but do not consume the existing token in this validation path
            try {
                const newToken = uuidv4();
                const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
                user.verificationToken = newToken;
                user.verificationTokenExpires = newExpiry;
                await this.userService.save(user);
                await this.mailService.sendVerificationEmail(user.email, newToken);
            } catch (e) {
                console.error('[validateEmailToken] Failed to resend verification email:', e);
            }
            throw new HttpException('Verification token expired. A new verification email has been sent.', HttpStatus.GONE);
        }
        return { userId: user.id, email: user.email, expiresAt: user.verificationTokenExpires };
    }
}
