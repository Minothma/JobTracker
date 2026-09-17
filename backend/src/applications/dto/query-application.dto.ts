import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { application_status } from '@prisma/client';
import { Transform } from 'class-transformer';

export class QueryApplicationDto {
  @IsEnum(application_status)
  @IsOptional()
  status?: application_status;

  @IsString()
  @IsOptional()
  search?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  is_favorite?: boolean;

  @IsString()
  @IsOptional()
  work_mode?: string;
}
