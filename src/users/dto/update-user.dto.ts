import { IsString, IsOptional, IsDateString, IsIn, IsBoolean, IsEnum } from 'class-validator';
import { UserRole } from 'src/users/user.entity';

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    username?: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsDateString()
    dateOfBirth?: string;  // You may consider Date if you use transform

    @IsOptional()
    @IsString()
    phoneNumber?: string;  // ✅ Match with Entity

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    state?: string;

    @IsOptional()
    @IsString()
    country?: string;

    @IsOptional()
    @IsString()
    postalcode?: string;

    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;  // ✅ Directly use enum

    @IsOptional()
    @IsString()
    profilePicture?: string;

    @IsOptional()
    @IsString()
    bio?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsBoolean()
    isAccountVerified?: boolean;

    @IsOptional()
    @IsBoolean()
    isEmailVerified?: boolean;

    @IsOptional()
    @IsBoolean()
    isTwoFactorEnabled?: boolean;
}
