import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export class UserResponseDto {
    @ApiProperty()
    id: number;

    @ApiPropertyOptional()
    username?: string;

    @ApiProperty()
    email: string;

    @ApiProperty()
    firstName: string;

    @ApiPropertyOptional()
    lastName?: string;

    @ApiProperty()
    isActive: boolean;

    @ApiProperty()
    isEmailVerified: boolean;

    @ApiProperty()
    role: string;

    @ApiPropertyOptional()
    profilePicture?: string;

    @ApiPropertyOptional()
    bio?: string;

    @ApiPropertyOptional()
    phoneNumber?: string;

    @ApiPropertyOptional()
    address?: string;

    @ApiPropertyOptional({ type: String, format: 'date-time' })
    dateOfBirth?: Date;

    @ApiPropertyOptional()
    preferences?: string;

    @ApiPropertyOptional()
    isTwoFactorEnabled?: boolean;

    @ApiPropertyOptional()
    staffId?: string;

    @ApiPropertyOptional({ type: String, format: 'date-time' })
    lastLogin?: Date;

    @ApiPropertyOptional({ type: String, format: 'date-time' })
    createdAt?: Date;

    @Exclude()
    password?: string;
}
