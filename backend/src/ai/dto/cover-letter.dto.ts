import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CoverLetterTone {
  PROFESSIONAL = 'PROFESSIONAL',
  ENTHUSIASTIC = 'ENTHUSIASTIC',
  CONFIDENT = 'CONFIDENT',
  CONCISE = 'CONCISE',
}

export enum CoverLetterFormat {
  FULL_COVER_LETTER = 'FULL_COVER_LETTER',
  LINKEDIN_INMAIL_PITCH = 'LINKEDIN_INMAIL_PITCH',
}

export class GenerateCoverLetterDto {
  @ApiPropertyOptional({ description: 'Application ID if generating for an existing application' })
  @IsString()
  @IsOptional()
  application_id?: string;

  @ApiProperty({ description: 'Target company name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  company_name: string;

  @ApiProperty({ description: 'Target job role title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  role_title: string;

  @ApiPropertyOptional({ description: 'Target job posting description or key responsibilities' })
  @IsString()
  @IsOptional()
  job_description?: string;

  @ApiPropertyOptional({ description: 'Resume UUID to tailor the cover letter from' })
  @IsString()
  @IsOptional()
  resume_id?: string;

  @ApiPropertyOptional({ description: 'Direct text from candidate resume' })
  @IsString()
  @IsOptional()
  custom_resume_text?: string;

  @ApiPropertyOptional({ enum: CoverLetterTone, default: CoverLetterTone.PROFESSIONAL })
  @IsEnum(CoverLetterTone)
  @IsOptional()
  tone?: CoverLetterTone = CoverLetterTone.PROFESSIONAL;

  @ApiPropertyOptional({ enum: CoverLetterFormat, default: CoverLetterFormat.FULL_COVER_LETTER })
  @IsEnum(CoverLetterFormat)
  @IsOptional()
  format?: CoverLetterFormat = CoverLetterFormat.FULL_COVER_LETTER;

  @ApiPropertyOptional({ description: 'Candidate key achievements or special talking points' })
  @IsString()
  @IsOptional()
  @MaxLength(1500)
  key_achievements?: string;
}
