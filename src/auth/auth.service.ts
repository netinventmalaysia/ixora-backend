import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async validateUser(username: string, password: string) {
        const user = await this.usersService.findByUsername(username);
        if (!user) throw new UnauthorizedException('Invalid username');
        const match = await bcrypt.compare(password, user.password);
        if (!match) throw new UnauthorizedException('Invalid password');
        return user;
    }

    async login(user: any) {
        const payload = { username: user.username, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async logout(refreshToken: string) {
        // Implement your logout logic here, e.g., invalidate the refresh token
        return { message: 'Logged out successfully' };
    }

}
