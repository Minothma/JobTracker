import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NegotiateOfferDto {
  @ApiProperty({ description: 'Company name extending the offer' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  company_name: string;

  @ApiProperty({ description: 'Target job role title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  role_title: string;

  @ApiProperty({ description: 'Current offered base salary' })
  @IsNumber()
  @Min(0)
  current_base: number;

  @ApiPropertyOptional({ description: 'Current offered bonus' })
  @IsNumber()
  @IsOptional()
  current_bonus?: number;

  @ApiPropertyOptional({ description: 'Current offered equity value' })
  @IsNumber()
  @IsOptional()
  current_equity?: number;

  @ApiPropertyOptional({ description: 'Target base salary candidate wants to negotiate for' })
  @IsNumber()
  @IsOptional()
  target_base?: number;

  @ApiPropertyOptional({ description: 'Target bonus candidate wants to negotiate for' })
  @IsNumber()
  @IsOptional()
  target_bonus?: number;

  @ApiPropertyOptional({ description: 'Target equity candidate wants to negotiate for' })
  @IsNumber()
  @IsOptional()
  target_equity?: number;

  @ApiPropertyOptional({ description: 'Currency code (e.g. USD, EUR, LKR)' })
  @IsString()
  @IsOptional()
  currency?: string = 'USD';

  @ApiPropertyOptional({ description: 'Work arrangement (e.g. REMOTE, HYBRID, ONSITE)' })
  @IsString()
  @IsOptional()
  work_mode?: string = 'REMOTE';

  @ApiPropertyOptional({ description: 'Candidate unique leverage points (competing offers, specialized domain knowledge, etc.)' })
  @IsString()
  @IsOptional()
  @MaxLength(1500)
  leverage_points?: string;
}
