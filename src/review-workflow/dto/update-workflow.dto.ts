import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayUnique, IsArray, IsBoolean, IsEmail, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { ReviewStage } from '../review-workflow.entity';

export class ReviewWorkflowStageInputDto {
    @ApiProperty({ enum: ReviewStage })
    @IsEnum(ReviewStage)
    stage: ReviewStage;

    @ApiProperty({ type: Boolean, required: false, default: true })
    @IsOptional()
    @IsBoolean()
    enabled?: boolean;

    @ApiProperty({ type: [String], description: 'List of user emails assigned to the stage' })
    @IsArray()
    @ArrayUnique()
    @IsEmail({}, { each: true })
    user_emails: string[];
}

export class UpdateModuleWorkflowDto {
    @ApiProperty({ type: [ReviewWorkflowStageInputDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReviewWorkflowStageInputDto)
    stages: ReviewWorkflowStageInputDto[];
}
