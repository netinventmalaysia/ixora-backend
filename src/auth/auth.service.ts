import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
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
}
