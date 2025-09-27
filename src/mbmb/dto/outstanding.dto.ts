import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class AssessmentOutstandingQueryDto {
    @ApiPropertyOptional({ description: 'MyKad (12 digits, no dashes)', example: '900101015555' })
    @IsOptional()
    @Matches(/^\d{12}$/)
    ic?: string;

    @ApiPropertyOptional({ description: 'Assessment/account number' })
    @IsOptional()
    @IsString()
    assessment_no?: string;
}

export class CompoundOutstandingQueryDto {
    @ApiPropertyOptional({ description: 'MyKad (12 digits, no dashes)', example: '900101015555' })
    @IsOptional()
    @Matches(/^\d{12}$/)
    ic?: string;

    @ApiPropertyOptional({ description: 'Compound number' })
    @IsOptional()
    @IsString()
    compound_no?: string;
}

export class BoothOutstandingQueryDto {
    @ApiPropertyOptional({ description: 'MyKad (12 digits, no dashes)', example: '900101015555' })
    @IsOptional()
    @Matches(/^\d{12}$/)
    ic?: string;

    @ApiPropertyOptional({ description: 'Booth number' })
    @IsOptional()
    @IsString()
    booth_no?: string;
}

export class MiscOutstandingQueryDto {
    @ApiPropertyOptional({ description: 'MyKad (12 digits, no dashes)', example: '900101015555' })
    @IsOptional()
    @Matches(/^\d{12}$/)
    ic?: string;

    @ApiPropertyOptional({ description: 'Miscellaneous bill number (alias bill_no accepted)' })
    @IsOptional()
    @IsString()
    misc_no?: string;

    @ApiPropertyOptional({ description: 'Alias for misc_no' })
    @IsOptional()
    @IsString()
    bill_no?: string;
}

export type PublicBill = {
    id: string | number;
    bill_no: string;
    amount: number;
    due_date: string;
    description?: string;
};
