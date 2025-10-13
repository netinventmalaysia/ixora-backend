import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsInt, IsObject, IsOptional, Min, ValidateIf } from 'class-validator';

export class UpsertDraftDto {
    @ApiProperty({ name: 'business_id', type: Number })
    @Transform(({ value }) => (value !== undefined ? Number(value) : value))
    @Type(() => Number)
    @IsInt()
    business_id: number;

    @ApiProperty({ description: 'Project form payload', type: Object })
    @IsObject()
    data: Record<string, any>;
}

export class SubmitProjectDto {
    @ApiProperty({ name: 'business_id', type: Number })
    @Transform(({ value }) => (value !== undefined ? Number(value) : value))
    @Type(() => Number)
    @IsInt()
    business_id: number;

    @ApiPropertyOptional({ description: 'If true, submit latest draft for the user', default: true })
    @IsOptional()
    @IsBoolean()
    useDraft?: boolean = true;

    @ApiPropertyOptional({ description: 'Project form payload; required if useDraft is false or no draft exists', type: Object })
    @IsOptional()
    @ValidateIf((o) => !o.useDraft)
    @IsObject()
    data?: Record<string, any>;

    @ApiPropertyOptional({ description: 'If provided, submit the specified draft id in-place' })
    @IsOptional()
    @Type(() => Number)
    @Transform(({ value }) => (value !== undefined ? Number(value) : value))
    @IsInt()
    draft_id?: number;

    @ApiPropertyOptional({ description: 'User IDs of project owners to grant view access', type: [Number] })
    @IsOptional()
    @IsArray()
    @Transform(({ value }) => {
        if (Array.isArray(value)) return value.map((v) => Number(v)).filter((n) => !isNaN(n));
        if (typeof value === 'string') return value.split(',').map((v) => Number(v.trim())).filter((n) => !isNaN(n));
        return undefined;
    })
    owners_user_ids?: number[];
}

export class SubmitDraftByIdDto {
    @ApiProperty({ name: 'business_id', type: Number })
    @Transform(({ value }) => (value !== undefined ? Number(value) : value))
    @Type(() => Number)
    @IsInt()
    business_id: number;

    @ApiPropertyOptional({ description: 'If provided, save changes before submitting', type: Object })
    @IsOptional()
    @IsObject()
    data?: Record<string, any>;

    @ApiPropertyOptional({ description: 'User IDs of project owners to grant view access', type: [Number] })
    @IsOptional()
    @IsArray()
    @Transform(({ value }) => {
        if (Array.isArray(value)) return value.map((v) => Number(v)).filter((n) => !isNaN(n));
        if (typeof value === 'string') return value.split(',').map((v) => Number(v.trim())).filter((n) => !isNaN(n));
        return undefined;
    })
    owners_user_ids?: number[];
}

export class ListDraftsQueryDto {
    @IsOptional()
    @Type(() => Number)
    @Transform(({ value }) => (value !== undefined ? Number(value) : 20))
    @IsInt()
    @Min(0)
    limit?: number = 20;

    @IsOptional()
    @Type(() => Number)
    @Transform(({ value }) => (value !== undefined ? Number(value) : 0))
    @IsInt()
    @Min(0)
    offset?: number = 0;

    // Optional: filter by a specific business
    @IsOptional()
    @Type(() => Number)
    @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
    @IsInt()
    business_id?: number;
}

export class ListProjectsQueryDto extends ListDraftsQueryDto {
    @IsOptional()
    @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : value))
    @IsIn(['draft', 'submitted'])
    status?: 'draft' | 'submitted';
}
