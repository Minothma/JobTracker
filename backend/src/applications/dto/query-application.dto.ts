import { IsEnum, IsOptional, IsString } from 'class-validator';
import { application_status } from '@prisma/client';

export class QueryApplicationDto {
  @IsEnum(application_status)
  @IsOptional()
  status?: application_status;

  @IsString()
  @IsOptional()
  search?: string;
}
