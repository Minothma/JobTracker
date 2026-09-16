import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class MatchResumeDto {
  @IsNotEmpty()
  @IsString()
  job_description: string;

  @IsOptional()
  @IsUUID()
  resume_id?: string;

  @IsOptional()
  @IsString()
  resume_text?: string;

  @IsOptional()
  @IsString()
  role_title?: string;

  @IsOptional()
  @IsString()
  company_name?: string;
}
