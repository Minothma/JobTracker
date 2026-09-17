import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Min,
} from 'class-validator';
import { application_status } from '@prisma/client';

export class CreateApplicationDto {
  @IsString()
  @IsNotEmpty()
  company_name: string;

  @IsString()
  @IsNotEmpty()
  role_title: string;

  @IsDateString()
  @IsNotEmpty()
  applied_date: string;

  @IsEnum(application_status)
  @IsOptional()
  status?: application_status;

  @IsUrl({}, { message: 'job_posting_url must be a valid URL' })
  @IsOptional()
  job_posting_url?: string;

  @IsUUID('4')
  @IsOptional()
  resume_id?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  salary_min?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  salary_max?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  work_mode?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  job_description?: string;

  @IsBoolean()
  @IsOptional()
  is_favorite?: boolean;

  @IsString()
  @IsOptional()
  contact_name?: string;

  @IsString()
  @IsOptional()
  contact_email?: string;

  @IsString()
  @IsOptional()
  rejection_reason?: string;
}
