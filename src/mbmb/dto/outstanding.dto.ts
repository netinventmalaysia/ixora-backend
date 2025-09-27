import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class AssessmentOutstandingQueryDto {
    @ApiPropertyOptional({ description: 'MyKad (12 digits, no dashes)', example: '900101015555' })
    @IsOptional()
    @Matches(/^\d{12}$/)
    ic?: string;

    @ApiPropertyOptional({ description: 'Alias for MyKad (upstream param name no_kp)', example: '900101015555' })
    @IsOptional()
    @Matches(/^\d{12}$/)
    no_kp?: string;

    @ApiPropertyOptional({ description: 'Account number (preferred FE param)', example: 'A123456' })
    @IsOptional()
    @IsString()
    account_no?: string;

    @ApiPropertyOptional({ description: 'Bill number (preferred FE param)', example: 'BIL-2025-0001' })
    @IsOptional()
    @IsString()
    bill_no?: string;

    @ApiPropertyOptional({ description: 'Deprecated alias for account number' })
    @IsOptional()
    @IsString()
    assessment_no?: string;
}

export class CompoundOutstandingQueryDto {
    @ApiPropertyOptional({ description: 'MyKad (12 digits, no dashes)', example: '900101015555' })
    @IsOptional()
    @Matches(/^\d{12}$/)
    ic?: string;

    @ApiPropertyOptional({ description: 'Alias for MyKad (upstream param name no_kp)', example: '900101015555' })
    @IsOptional()
    @Matches(/^\d{12}$/)
    no_kp?: string;

    @ApiPropertyOptional({ description: 'Alias for MyKad specific to compound (upstream param name noicmilik)', example: '900101015555' })
    @IsOptional()
    @Matches(/^\d{12}$/)
    noicmilik?: string;

    @ApiPropertyOptional({ description: 'Compound number (preferred FE param)' })
    @IsOptional()
    @IsString()
    compound_no?: string;

    @ApiPropertyOptional({ description: 'Vehicle registration number (preferred FE param name as provided)' })
    @IsOptional()
    @IsString()
    vehicel_registration_no?: string;

    @ApiPropertyOptional({ description: 'Alias: vehicle_registration_no' })
    @IsOptional()
    @IsString()
    vehicle_registration_no?: string;

    // no extra legacy alias needed
}

export class BoothOutstandingQueryDto {
    @ApiPropertyOptional({ description: 'MyKad (12 digits, no dashes)', example: '900101015555' })
    @IsOptional()
    @Matches(/^\d{12}$/)
    ic?: string;

    @ApiPropertyOptional({ description: 'Alias for MyKad (upstream param name no_kp)', example: '900101015555' })
    @IsOptional()
    @Matches(/^\d{12}$/)
    no_kp?: string;

    @ApiPropertyOptional({ description: 'Account number (preferred FE param)' })
    @IsOptional()
    @IsString()
    account_no?: string;

    @ApiPropertyOptional({ description: 'Booth number (legacy alias to account number)' })
    @IsOptional()
    @IsString()
    booth_no?: string;
}

export class MiscOutstandingQueryDto {
    @ApiPropertyOptional({ description: 'MyKad (12 digits, no dashes)', example: '900101015555' })
    @IsOptional()
    @Matches(/^\d{12}$/)
    ic?: string;

    @ApiPropertyOptional({ description: 'Alias for MyKad (upstream param name no_kp)', example: '900101015555' })
    @IsOptional()
    @Matches(/^\d{12}$/)
    no_kp?: string;

    @ApiPropertyOptional({ description: 'Account number (preferred FE param)' })
    @IsOptional()
    @IsString()
    account_no?: string;

    @ApiPropertyOptional({ description: 'Deprecated alias for account number' })
    @IsOptional()
    @IsString()
    misc_no?: string;

    @ApiPropertyOptional({ description: 'Deprecated alias; previously accepted for misc' })
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
