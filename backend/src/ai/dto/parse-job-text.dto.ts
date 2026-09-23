import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ParseJobTextDto {
  @ApiProperty({
    description: 'Raw text of a job posting or LinkedIn/Indeed description to extract structured details from',
    example: 'Senior Full Stack Engineer at Acme Corp. Location: Remote (US). Salary: $130,000 - $160,000 USD. Contact: alex@acme.com...',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(15, { message: 'Job posting text must be at least 15 characters long' })
  text: string;
}
