import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsObject, IsOptional, ValidateIf } from 'class-validator';

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
}
