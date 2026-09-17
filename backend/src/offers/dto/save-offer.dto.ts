import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SaveOfferDto {
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  base_salary: number;

  @IsString()
  @IsOptional()
  currency?: string = 'USD';

  @IsNumber()
  @Min(0)
  @IsOptional()
  bonus?: number = 0;

  @IsNumber()
  @Min(0)
  @IsOptional()
  equity?: number = 0;

  @IsString()
  @IsOptional()
  work_mode?: string = 'REMOTE';

  @IsString()
  @IsOptional()
  benefits_summary?: string;

  @IsDateString()
  @IsOptional()
  offer_deadline?: string;
}
