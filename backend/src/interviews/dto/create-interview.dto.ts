import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateInterviewDto {
  @IsString()
  @IsNotEmpty({ message: 'Round type is required (e.g. Phone screen, Technical, Behavioral, Onsite)' })
  @MaxLength(100)
  round_type: string;

  @IsDateString({}, { message: 'scheduled_at must be a valid ISO-8601 date string' })
  @IsNotEmpty()
  scheduled_at: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  outcome?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
