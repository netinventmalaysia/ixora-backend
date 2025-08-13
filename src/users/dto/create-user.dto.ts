import { IsString, IsEmail, IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../user.entity';

export class CreateUserDto {
    @ApiProperty()
    @IsString()
    username: string;

    @ApiProperty()
    @IsString()
    password: string;

    @ApiProperty()
    @IsEmail()
    email: string;

    @ApiProperty()
    @IsString()
    firstName: string;

    @ApiProperty()
    @IsString()
    lastName: string;

    @ApiProperty()
    @IsString()
    identificationType: string;

    @ApiProperty()
    @IsString()
    identificationNumber: string;

    // @ApiProperty()
    // @IsBoolean()
    // isActive: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    profilePicture?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    bio?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    phoneNumber?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    city?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    state?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    postalcode?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    country?: string;


    @ApiPropertyOptional({ type: String, format: 'date-time' })  // Optional date field
    @IsOptional()
    dateOfBirth?: Date;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    preferences?: string;

    // @ApiPropertyOptional()
    // @IsOptional()
    // @IsBoolean()
    // isTwoFactorEnabled?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    staffId?: string;

    @ApiProperty({ enum: UserRole })
    @IsEnum(UserRole)
    role: UserRole;

    // @ApiProperty()
    // @IsBoolean()
    // isEmailVerified: boolean;
}
