import { Controller, Post, Body, Get, Req, Res, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { Request, Response } from 'express';

@ApiTags('Authentications')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @ApiOperation({ summary: 'User login' })
    @ApiResponse({ status: 200, description: 'User logged in successfully', type: TokenResponseDto })
    async login(
        @Body() dto: LoginDto,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response
    ) {
        const { accessToken, user } = await this.authService.login(dto.email, dto.password);

        res.cookie('auth_token', accessToken, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none', // ⚠️ Must be paired with secure: true in production
            path: '/',
            maxAge: 60 * 60 * 1000, // 1 hour
        });

        return {
            message: 'Login successful',
            user: {
                id: user.id,
                role: user.role,
                email: user.email,
                username: user.username,
            },
        };
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
            path: '/',
            maxAge: 60 * 60 * 1000,
        });

        return {
            message: 'Guest login successful',
            user,
        };
    }

    @Post('logout')
    @ApiOperation({ summary: 'User logout' })
    @ApiResponse({ status: 200, description: 'User logged out successfully' })
    async logout() {
        return this.authService.logout();
    }

    @Get('csrf-token')
    @ApiOperation({ summary: 'Get CSRF token' })
    @ApiResponse({ status: 200, description: 'Returns CSRF token' })
    getCsrfToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        try {
            const token = req.csrfToken();
            console.log('Generated CSRF token:', token);
            if (!token) {
                console.error('CSRF token generation failed: Token is missing');
                throw new Error('Failed to generate CSRF token');
            }

            console.log('Generated CSRF token:', token);
            return { csrfToken: token };
        } catch (error) {
            console.error('CSRF token generation failed:', error);
            throw new Error('Failed to generate CSRF token');
        }
    }


    @Post('forgot-password')
    @ApiOperation({ summary: 'Request password reset' })
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.requestPasswordReset(dto.email);
    }

    @Get('verify-reset-token/:token')
    @ApiOperation({ summary: 'Verify reset password token' })
    async verifyResetToken(@Param('token') token: string) {
        const user = await this.authService.verifyResetToken(token);
        return { message: 'Token valid', email: user.email };
    }

    @Post('reset-password')
    @ApiOperation({ summary: 'Reset password' })
    async resetPassword(@Body() body: ResetPasswordDto) {
        return this.authService.resetPassword(body.token, body.newPassword);
    }

    @Get('verify-email/validate')
    @ApiOperation({ summary: 'Validate email verification token (non-consuming)' })
    @ApiResponse({ status: 200, description: 'Token is valid (not consumed)' })
    async verifyEmail(@Query('token') token: string) {
        if (!token) throw new HttpException({ error: 'Missing token' }, HttpStatus.BAD_REQUEST);
        const result = await this.authService.validateEmailToken(token);
        return { message: 'Token valid', userId: result.userId, email: result.email, expiresAt: result.expiresAt };
    }

    @Post('verify-email/confirm')
    @ApiOperation({ summary: 'Verify email by token (POST alias)' })
    async verifyEmailConfirm(@Body() body: { token?: string }) {
        const token = body?.token || '';
        if (!token) throw new HttpException({ error: 'Missing token' }, HttpStatus.BAD_REQUEST);
        const result = await this.authService.verifyEmail(token);
        return { message: 'Email verified successfully', userId: result.id, email: result.email };
    }
}
