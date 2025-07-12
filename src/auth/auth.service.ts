import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../users/user.service';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService,
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

        const payload = { sub: user.id, email: user.email, role: user.role };
        return {
            accessToken: this.jwtService.sign(payload),
            user,
        };
    }

    async logout(refreshToken: string) {
        return { message: 'Logged out successfully' };
    }

    async guestLogin() {
        const guestUser = {
            id: `guest-${uuidv4()}`, // Unique guest ID
            name: 'Guest User',
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
}

