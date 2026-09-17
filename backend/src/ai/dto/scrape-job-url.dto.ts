import { IsNotEmpty, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ScrapeJobUrlDto {
  @ApiProperty({
    description: 'Public job posting URL to extract details and metadata from',
    example: 'https://careers.google.com/jobs/results/123456789/',
  })
  @IsUrl(
    { require_protocol: true },
    { message: 'job_url must be a valid HTTP or HTTPS URL (e.g. https://...)' },
  )
  @IsNotEmpty()
  url: string;
}
