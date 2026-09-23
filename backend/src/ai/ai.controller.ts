import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { MatchResumeDto } from './dto/match-resume.dto';
import { GenerateEmailDto } from './dto/generate-email.dto';
import { InterviewPrepDto } from './dto/interview-prep.dto';
import { ScrapeJobUrlDto } from './dto/scrape-job-url.dto';
import { GenerateCoverLetterDto } from './dto/cover-letter.dto';
import { EvaluateAnswerDto } from './dto/evaluate-answer.dto';
import { NegotiateOfferDto } from './dto/negotiate-offer.dto';
import { ParseJobTextDto } from './dto/parse-job-text.dto';
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

  @Post('cover-letter')
  @ApiOperation({
    summary: 'Generate tailored job application cover letter or LinkedIn InMail outreach pitch',
  })
  @ApiResponse({ status: 200, description: 'Personalized cover letter markdown or InMail pitch returned' })
  async generateCoverLetter(
    @CurrentUser('id') userId: string,
    @Body() generateCoverLetterDto: GenerateCoverLetterDto,
  ) {
    return this.aiService.generateCoverLetter(userId, generateCoverLetterDto);
  }

  @Post('evaluate-answer')
  @ApiOperation({
    summary: 'Evaluate candidate interview practice answer using STAR framework and provide constructive feedback',
  })
  @ApiResponse({ status: 200, description: 'Score, STAR breakdown, strengths, and improved answer returned' })
  async evaluateAnswer(
    @CurrentUser('id') userId: string,
    @Body() evaluateAnswerDto: EvaluateAnswerDto,
  ) {
    return this.aiService.evaluateInterviewAnswer(userId, evaluateAnswerDto);
  }

  @Post('negotiate-offer')
  @ApiOperation({
    summary: 'Generate strategic salary negotiation counter-offer plan, phone script, and email draft',
  })
  @ApiResponse({ status: 200, description: 'Counter-offer strategy, phone script, and email draft returned' })
  async negotiateOffer(
    @CurrentUser('id') userId: string,
    @Body() negotiateOfferDto: NegotiateOfferDto,
  ) {
    return this.aiService.negotiateOfferStrategy(userId, negotiateOfferDto);
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

  @Post('parse-job-text')
  @ApiOperation({
    summary: 'Parse raw job description text with AI and extract structured fields (role, company, salary, work mode, skills)',
  })
  @ApiResponse({ status: 200, description: 'Structured job details extracted from text' })
  async parseJobText(
    @CurrentUser('id') userId: string,
    @Body() parseJobTextDto: ParseJobTextDto,
  ) {
    return this.aiService.parseJobText(userId, parseJobTextDto);
  }
}


