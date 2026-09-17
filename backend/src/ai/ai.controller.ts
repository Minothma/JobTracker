import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { MatchResumeDto } from './dto/match-resume.dto';
import { GenerateEmailDto } from './dto/generate-email.dto';
import { InterviewPrepDto } from './dto/interview-prep.dto';
import { ScrapeJobUrlDto } from './dto/scrape-job-url.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('AI')
@ApiBearerAuth('JWT-auth')
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('match-resume')
  @ApiOperation({
    summary: 'Evaluate ATS resume compatibility against job description (Google Gemini AI + semantic fallback)',
  })
  @ApiResponse({ status: 200, description: 'ATS score, matched/missing skills, and resume tailoring tips returned' })
  async matchResume(
    @CurrentUser('id') userId: string,
    @Body() matchResumeDto: MatchResumeDto,
  ) {
    return this.aiService.matchResume(userId, matchResumeDto);
  }

  @Post('generate-email')
  @ApiOperation({
    summary: 'Generate personalized job outreach, thank you, follow-up, or offer negotiation email',
  })
  @ApiResponse({ status: 200, description: 'Tailored email subject and body generated' })
  async generateEmail(
    @CurrentUser('id') userId: string,
    @Body() generateEmailDto: GenerateEmailDto,
  ) {
    return this.aiService.generateEmail(userId, generateEmailDto);
  }

  @Post('interview-prep')
  @ApiOperation({
    summary: 'Generate realistic interview practice questions, sample answer frameworks, and tips',
  })
  @ApiResponse({ status: 200, description: 'List of tailored interview questions and preparation advice' })
  async generateInterviewPrep(
    @CurrentUser('id') userId: string,
    @Body() interviewPrepDto: InterviewPrepDto,
  ) {
    return this.aiService.generateInterviewPrep(userId, interviewPrepDto);
  }

  @Post('scrape-job-url')
  @ApiOperation({
    summary: 'Extract structured job title, company, location, and description from a job posting URL',
  })
  @ApiResponse({ status: 200, description: 'Scraped job details extracted from OpenGraph/JSON-LD metadata' })
  async scrapeJobUrl(
    @Body() scrapeJobUrlDto: ScrapeJobUrlDto,
  ) {
    return this.aiService.scrapeJobPostingUrl(scrapeJobUrlDto);
  }
}
