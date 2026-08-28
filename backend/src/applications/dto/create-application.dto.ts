import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, IsUUID } from 'class-validator';
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
}
