import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateInterviewDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  round_type?: string;

  @IsDateString({}, { message: 'scheduled_at must be a valid ISO-8601 date string' })
  @IsOptional()
  scheduled_at?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  outcome?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
