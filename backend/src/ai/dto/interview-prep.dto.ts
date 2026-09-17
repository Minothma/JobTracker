import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum InterviewRoundType {
  TECHNICAL = 'TECHNICAL',
  BEHAVIORAL = 'BEHAVIORAL',
  SYSTEM_DESIGN = 'SYSTEM_DESIGN',
  MIXED = 'MIXED',
}

export class InterviewPrepDto {
  @ApiPropertyOptional({ description: 'Optional application ID to auto-load job description and resume' })
  @IsOptional()
  @IsString()
  application_id?: string;

  @ApiPropertyOptional({ description: 'Target job role title', example: 'Full Stack Engineer' })
  @IsOptional()
  @IsString()
  role_title?: string;

  @ApiPropertyOptional({ description: 'Target company name', example: 'Google' })
  @IsOptional()
  @IsString()
  company_name?: string;

  @ApiPropertyOptional({ description: 'Full job description text' })
  @IsOptional()
  @IsString()
  job_description?: string;

  @ApiPropertyOptional({ description: 'Specific resume ID in user storage' })
  @IsOptional()
  @IsString()
  resume_id?: string;

  @ApiPropertyOptional({ description: 'Direct text content of candidate resume' })
  @IsOptional()
  @IsString()
  resume_text?: string;

  @ApiPropertyOptional({
    enum: InterviewRoundType,
    description: 'Target interview round format',
    default: InterviewRoundType.MIXED,
  })
  @IsOptional()
  @IsEnum(InterviewRoundType)
  round_type?: InterviewRoundType;

  @ApiPropertyOptional({
    type: [String],
    description: 'Key focus areas or technical domains to emphasize',
    example: ['PostgreSQL Indexing', 'Microservices Architecture', 'System Resilience'],
  })
  @IsOptional()
  @IsArray()
  focus_areas?: string[];
}
