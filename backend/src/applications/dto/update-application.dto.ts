import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Min,
} from 'class-validator';
import { application_status } from '@prisma/client';

export class UpdateApplicationDto {
  @IsString()
  @IsOptional()
  company_name?: string;

  @IsString()
  @IsOptional()
  role_title?: string;

  @IsDateString()
  @IsOptional()
  applied_date?: string;

  @IsEnum(application_status)
  @IsOptional()
  status?: application_status;

  @IsUrl({}, { message: 'job_posting_url must be a valid URL' })
  @IsOptional()
  job_posting_url?: string;

  @IsUUID('4')
  @IsOptional()
  resume_id?: string | null;

  @IsNumber()
  @Min(0)
  @IsOptional()
  salary_min?: number | null;

  @IsNumber()
  @Min(0)
  @IsOptional()
  salary_max?: number | null;

  @IsString()
  @IsOptional()
  currency?: string | null;

  @IsString()
  @IsOptional()
  work_mode?: string | null;

  @IsString()
  @IsOptional()
  location?: string | null;

  @IsString()
  @IsOptional()
  job_description?: string | null;

  @IsBoolean()
  @IsOptional()
  is_favorite?: boolean;

  @IsString()
  @IsOptional()
  contact_name?: string | null;

  @IsString()
  @IsOptional()
  contact_email?: string | null;

  @IsString()
  @IsOptional()
  rejection_reason?: string | null;
}
