import { IsString, IsEmail, IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserIdType } from '../user.entity';

export class CreateUserDto {
    @ApiProperty()
    @IsString()
    password: string;

    @ApiProperty()
    @IsEmail()
    email: string;

    @ApiProperty()
    @IsString()
    firstName: string;

    // identification type is required and must be one of the enum
    @ApiProperty({ enum: UserIdType })
    @IsEnum(UserIdType)
    identificationType: UserIdType;

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

    // Premise / Lot / Street Address
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

    // ZIP / Postal code
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    postalcode?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    country?: string;


    @ApiPropertyOptional({ type: String, format: 'date-time' })  // Optional date of birth
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

    @ApiPropertyOptional({ enum: UserRole })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    // @ApiProperty()
    // @IsBoolean()
    // isEmailVerified: boolean;
}
