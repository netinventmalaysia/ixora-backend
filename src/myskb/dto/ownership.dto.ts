import { IsEmail, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { OwnershipScope, OwnershipStatus } from '../ownership.entity';

export class OwnershipItemDto {
  id: number;
  user_id?: number | null;
  name?: string | null;
  email: string;
  role?: string | null;
  project?: string | null;
  avatar_url?: string | null;
  last_seen_iso?: string | null;
  status: 'Pending' | 'Approved' | 'Rejected';
  created_at?: string;
  updated_at?: string;
  scope?: 'project-only' | 'full';
}

export class ListOwnershipQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  business_id: number;

  @IsOptional()
  @IsEnum(OwnershipStatus)
  status?: OwnershipStatus;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  sort?: string; // default createdAt desc
}

export class InviteOwnershipDto {
  @IsInt() @Min(1)
  business_id: number;

  @IsEmail()
  email: string;

  @IsOptional() @IsString() @MaxLength(100)
  project?: string;

  @IsOptional() @IsString() @MaxLength(50)
  role?: string;
}

export class UpdateOwnershipDto {
  @IsOptional() @IsEnum(OwnershipStatus)
  status?: OwnershipStatus;

  @IsOptional() @IsString() @MaxLength(50)
  role?: string;

  @IsOptional() @IsString() @MaxLength(100)
  project?: string;
}

export class AccessResponseDto {
  allowedTabs: string[];
}
