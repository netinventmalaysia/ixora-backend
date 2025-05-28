import { IsString, IsEmail, IsBoolean, IsOptional } from 'class-validator';

export class CreateUserDto {
    @IsString()
    username: string;

    @IsString()
    password: string;

    @IsEmail()
    email: string;

    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsBoolean()
    isActive: boolean;

    @IsOptional()
    @IsString()
    profilePicture?: string;

    @IsOptional()
    @IsString()
    bio?: string;

    @IsOptional()
    @IsString()
    phoneNumber?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    dateOfBirth?: Date;

    @IsOptional()
    @IsString()
    preferences?: string;

    @IsOptional()
    @IsBoolean()
    isTwoFactorEnabled?: boolean;

    @IsOptional()
    @IsString()
    staffId?: string;

    @IsString()
    role: 'admin' | 'user' | 'superadmin';

    @IsBoolean()
    isEmailVerified: boolean;
}
