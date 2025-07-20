import { Controller, Post, Body, Get, Req, Res, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import e, { Request, Response } from 'express';
import { UserRole } from 'src/users/user.entity';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('Authentications')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    @ApiOperation({ summary: 'User login' })
    @ApiResponse({ status: 200, description: 'User logged in successfully', type: TokenResponseDto })
    async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const { accessToken, user } = await this.authService.login(dto.email, dto.password);
        // res.cookie('auth_token', accessToken, {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === 'production',
        //     sameSite: 'none',
        //     maxAge: 1000 * 60 * 60, // 1 hour
        // });

        res.cookie('auth_token', accessToken, {
            httpOnly: true,
            sameSite: 'lax',
            secure: false,
            path: '/',
            maxAge: 60 * 60 * 1000, // 1 hour
        });

        return {
            message: 'Login successful', user: {
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
            maxAge: 1000 * 60 * 60, // 1 hour
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
    getCsrfToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const token = req.csrfToken();
        res.cookie('_csrf', token, {
            httpOnly: false,
            sameSite: 'none',
            secure: process.env.NODE_ENV === 'production',
        });
        return { csrfToken: token };
    }

    @Post('forgot-password')
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        console.log('Request body:', dto);
        return this.authService.requestPasswordReset(dto.email);
    }

    @Get('verify-reset-token/:token')
    async verifyResetToken(@Param('token') token: string) {
        const user = await this.authService.verifyResetToken(token);
        return { message: 'Token valid', email: user.email };
    }

    @Post('reset-password')
    async resetPassword(@Body() body: ResetPasswordDto) {
        console.log('Reset password request:', body);
        return this.authService.resetPassword(body.token, body.newPassword);
    }

}
