import { Controller, Post, Body, Get, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { Request, Response } from 'express';
import { UserRole } from 'src/users/user.entity';

@ApiTags('Authentications')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    @ApiOperation({ summary: 'User login' })
    @ApiResponse({ status: 200, description: 'User logged in successfully', type: TokenResponseDto })
    async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const { accessToken } = await this.authService.login(dto.email, dto.password);

        res.cookie('auth_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none',
            maxAge: 1000 * 60 * 60, // 1 hour
        });

        return { message: 'Login successful' };
    }

    @Post('logout')
    @ApiOperation({ summary: 'User logout' })
    @ApiResponse({ status: 200, description: 'User logged out successfully' })
    async logout(@Body() body: LogoutDto) {
        return this.authService.logout(body.refreshToken);
    }

    @Get('csrf-token')
    getCsrfToken(@Req() req: Request) {
        return { csrfToken: req.csrfToken() };
    }

    @Post('guest-login')
    @ApiOperation({ summary: 'Guest login' })
    @ApiResponse({ status: 200, description: 'Guest logged in successfully', type: TokenResponseDto })
    async guestLogin(@Res({ passthrough: true }) res: Response) {
        const { accessToken, user } = await this.authService.guestLogin();

        res.cookie('auth_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none',
            maxAge: 1000 * 60 * 60, // 1 hour
        });

        return {
            message: 'Guest login successful',
            user,
        };
    }
}
