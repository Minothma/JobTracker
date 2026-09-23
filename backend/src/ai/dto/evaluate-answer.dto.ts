import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EvaluateAnswerDto {
  @ApiProperty({ description: 'The interview question being answered' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  question: string;

  @ApiProperty({ description: 'The candidate spoken or typed answer to evaluate' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  candidate_answer: string;

  @ApiPropertyOptional({ description: 'Target job role title' })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  role_title?: string;

  @ApiPropertyOptional({ description: 'Target company name' })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  company_name?: string;

  @ApiPropertyOptional({ description: 'Interview round format (e.g. TECHNICAL, BEHAVIORAL)' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  round_type?: string;
}
