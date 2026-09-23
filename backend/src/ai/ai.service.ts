import { Injectable, Logger, NotFoundException, BadRequestException, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ResumesService } from '../resumes/resumes.service';
import { MatchResumeDto } from './dto/match-resume.dto';
import { GenerateEmailDto, EmailType, EmailTone } from './dto/generate-email.dto';
import { InterviewPrepDto, InterviewRoundType } from './dto/interview-prep.dto';
import { ScrapeJobUrlDto } from './dto/scrape-job-url.dto';
import { GenerateCoverLetterDto, CoverLetterTone, CoverLetterFormat } from './dto/cover-letter.dto';
import { EvaluateAnswerDto } from './dto/evaluate-answer.dto';
import { NegotiateOfferDto } from './dto/negotiate-offer.dto';
import { ParseJobTextDto } from './dto/parse-job-text.dto';

export interface ParsedJobTextResult {
  company_name?: string;
  role_title?: string;
  work_mode?: 'REMOTE' | 'HYBRID' | 'ONSITE';
  location?: string;
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  contact_name?: string;
  contact_email?: string;
  key_skills: string[];
  job_summary: string;
  extracted_with: string;
}

export interface AiMatchResult {
  score: number;
  verdict: 'STRONG_MATCH' | 'MODERATE_MATCH' | 'NEEDS_IMPROVEMENT';
  matched_skills: string[];
  missing_skills: string[];
  recommendations: string[];
  interview_focus_areas: string[];
  summary: string;
  analyzed_with: string;
}

export interface AiEmailResult {
  subject: string;
  body: string;
  type: EmailType;
  tone: EmailTone;
  generated_with: string;
}

export interface InterviewQuestion {
  id: string;
  category: 'TECHNICAL' | 'BEHAVIORAL' | 'SYSTEM_DESIGN' | 'EXPERIENCE';
  question: string;
  context_or_why_asked: string;
  sample_answer_framework: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export interface AiInterviewPrepResult {
  role_title: string;
  company_name: string;
  round_type: InterviewRoundType;
  questions: InterviewQuestion[];
  general_interview_tips: string[];
  generated_with: string;
}

export interface AiCoverLetterResult {
  title: string;
  content: string;
  format: CoverLetterFormat;
  tone: CoverLetterTone;
  company_name: string;
  role_title: string;
  word_count: number;
  estimated_reading_minutes: number;
  key_selling_points: string[];
  generated_with: string;
}

export interface AiAnswerEvaluationResult {
  score: number;
  verdict: 'EXCELLENT' | 'SOLID' | 'NEEDS_WORK';
  star_breakdown: {
    situation: { present: boolean; comment: string };
    task: { present: boolean; comment: string };
    action: { present: boolean; comment: string };
    result: { present: boolean; comment: string };
  };
  strengths: string[];
  improvements: string[];
  improved_answer: string;
  generated_with: string;
}

export interface AiOfferNegotiationResult {
  strategy_summary: string;
  recommended_counter: {
    base_salary: number;
    bonus: number;
    equity: number;
    total_comp: number;
    increase_percentage: number;
  };
  talking_points: string[];
  phone_script: string;
  counter_email_draft: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  key_leverage_summary: string[];
  generated_with: string;
}

export interface ScrapedJobData {
  url: string;
  role_title?: string;
  company_name?: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  job_description?: string;
  source?: string;
  extracted_success: boolean;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly geminiApiKey: string | undefined;

  // Common technical skills dictionary for semantic extraction
  private readonly techSkillsDictionary = [
    'TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'C#',
    'React', 'Next.js', 'Vue', 'Angular', 'HTML5', 'CSS3', 'Tailwind CSS',
    'Node.js', 'NestJS', 'Express', 'Spring Boot', 'Django', 'FastAPI',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Prisma', 'TypeORM', 'Flyway',
    'AWS', 'Amazon Web Services', 'S3', 'SES', 'RDS', 'ECS', 'Fargate', 'Lambda', 'CDK',
    'Docker', 'Kubernetes', 'CI/CD', 'GitHub Actions', 'Jenkins', 'Terraform',
    'REST API', 'GraphQL', 'gRPC', 'Microservices', 'System Design', 'Kafka', 'RabbitMQ',
    'Jest', 'Supertest', 'Playwright', 'Cypress', 'Unit Testing', 'E2E Testing',
    'Agile', 'Scrum', 'Git', 'JWT', 'OAuth', 'Authentication', 'WebSockets',
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Optional() private readonly resumesService?: ResumesService,
  ) {
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY') || process.env.GEMINI_API_KEY;
    this.logger.log(`AiService initialized (Gemini API Configured: ${!!this.geminiApiKey})`);
  }

  async matchResume(userId: string, dto: MatchResumeDto): Promise<AiMatchResult> {
    let resumeContent = dto.resume_text || '';
    let resumeLabel = 'Uploaded Resume';

    if (dto.resume_id) {
      const resume = await this.prisma.resumes.findFirst({
        where: { id: dto.resume_id, user_id: userId },
      });
      if (!resume) {
        throw new NotFoundException('Selected resume not found');
      }
      resumeLabel = resume.version_label;
      if (!resumeContent) {
        try {
          if (this.resumesService) {
            const extracted = await this.resumesService.extractResumeText(userId, dto.resume_id);
            if (extracted?.extracted_text) {
              resumeContent = extracted.extracted_text;
            }
          }
        } catch {
          resumeContent = `Resume Version: ${resume.version_label} (${resume.original_filename})`;
        }
      }
    }


    if (!resumeContent.trim()) {
      resumeContent = `${dto.role_title || 'Software Engineer'} with experience in Full-Stack TypeScript, React, Next.js, Node.js, NestJS, PostgreSQL, Prisma, Docker, and AWS.`;
    }

    if (this.geminiApiKey) {
      try {
        const geminiResult = await this.analyzeWithGemini(dto.job_description, resumeContent, dto.role_title, dto.company_name);
        if (geminiResult) {
          return {
            ...geminiResult,
            analyzed_with: 'Google Gemini AI',
          };
        }
      } catch (err: any) {
        this.logger.warn(`Gemini API call failed, falling back to semantic parser: ${err.message}`);
      }
    }

    return this.analyzeWithSemanticParser(dto.job_description, resumeContent, dto.role_title, dto.company_name, resumeLabel);
  }

  async generateEmail(userId: string, dto: GenerateEmailDto): Promise<AiEmailResult> {
    const tone = dto.tone || EmailTone.PROFESSIONAL;

    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    const candidateName = user?.email ? user.email.split('@')[0] : 'Candidate';

    if (this.geminiApiKey) {
      try {
        const geminiEmail = await this.generateEmailWithGemini(dto, candidateName);
        if (geminiEmail) {
          return {
            subject: geminiEmail.subject,
            body: geminiEmail.body,
            type: dto.type,
            tone,
            generated_with: 'Google Gemini AI',
          };
        }
      } catch (err: any) {
        this.logger.warn(`Gemini Email generation failed, falling back to smart template: ${err.message}`);
      }
    }

    return this.generateEmailWithTemplates(dto, candidateName);
  }

  async generateInterviewPrep(userId: string, dto: InterviewPrepDto): Promise<AiInterviewPrepResult> {
    let roleTitle = dto.role_title || 'Software Engineer';
    let companyName = dto.company_name || 'Target Company';
    let jobDescription = dto.job_description || '';
    let resumeText = dto.resume_text || '';
    const roundType = dto.round_type || InterviewRoundType.MIXED;

    // Load from Application if provided
    if (dto.application_id) {
      const app = await this.prisma.applications.findFirst({
        where: { id: dto.application_id, user_id: userId },
        include: { resumes: true },
      });
      if (app) {
        roleTitle = app.role_title || roleTitle;
        companyName = app.company_name || companyName;
        jobDescription = app.job_description || jobDescription;
        if (app.resumes && !resumeText) {
          resumeText = `Resume: ${app.resumes.version_label} (${app.resumes.original_filename})`;
        }
      }
    }

    // Load from specific resume if provided
    if (dto.resume_id && !resumeText) {
      const resume = await this.prisma.resumes.findFirst({
        where: { id: dto.resume_id, user_id: userId },
      });
      if (resume) {
        resumeText = `Resume: ${resume.version_label} (${resume.original_filename})`;
      }
    }

    if (!jobDescription.trim()) {
      jobDescription = `${roleTitle} at ${companyName}. Requirements: Full-stack web application development, microservices, relational database modeling, cloud deployments, and clean code practices.`;
    }

    if (!resumeText.trim()) {
      resumeText = `Full-stack developer experienced in TypeScript, React, Next.js, Node.js, NestJS, PostgreSQL, Prisma, and Docker.`;
    }

    // Try Gemini if API key available
    if (this.geminiApiKey) {
      try {
        const geminiPrep = await this.generateInterviewPrepWithGemini(
          roleTitle,
          companyName,
          jobDescription,
          resumeText,
          roundType,
          dto.focus_areas,
        );
        if (geminiPrep && geminiPrep.questions?.length > 0) {
          return {
            role_title: roleTitle,
            company_name: companyName,
            round_type: roundType,
            questions: geminiPrep.questions,
            general_interview_tips: geminiPrep.general_interview_tips || [
              'Use the STAR method (Situation, Task, Action, Result) for behavioral answers.',
              'Clarify requirements and constraints before jumping into technical solutions.',
              'Mention observability, testability, and edge cases in system design questions.',
            ],
            generated_with: 'Google Gemini AI',
          };
        }
      } catch (err: any) {
        this.logger.warn(`Gemini Interview Prep generation failed, falling back to heuristic engine: ${err.message}`);
      }
    }

    return this.generateInterviewPrepWithFallback(
      roleTitle,
      companyName,
      jobDescription,
      resumeText,
      roundType,
      dto.focus_areas,
    );
  }

  async generateCoverLetter(userId: string, dto: GenerateCoverLetterDto): Promise<AiCoverLetterResult> {
    let companyName = dto.company_name;
    let roleTitle = dto.role_title;
    let jobDescription = dto.job_description || '';
    let resumeText = dto.custom_resume_text || '';
    const tone = dto.tone || CoverLetterTone.PROFESSIONAL;
    const format = dto.format || CoverLetterFormat.FULL_COVER_LETTER;

    if (dto.application_id) {
      const app = await this.prisma.applications.findFirst({
        where: { id: dto.application_id, user_id: userId },
        include: { resumes: true },
      });
      if (app) {
        companyName = companyName || app.company_name;
        roleTitle = roleTitle || app.role_title;
        jobDescription = jobDescription || app.job_description || '';
        if (app.resume_id && !resumeText && this.resumesService) {
          try {
            const extracted = await this.resumesService.extractResumeText(userId, app.resume_id);
            if (extracted?.extracted_text) {
              resumeText = extracted.extracted_text;
            }
          } catch {
            // fallback
          }
        }
      }
    }

    if (dto.resume_id && !resumeText && this.resumesService) {
      try {
        const extracted = await this.resumesService.extractResumeText(userId, dto.resume_id);
        if (extracted?.extracted_text) {
          resumeText = extracted.extracted_text;
        }
      } catch {
        // fallback
      }
    }

    if (!resumeText.trim()) {
      resumeText = `Experienced ${roleTitle || 'Software Engineer'} proficient in full-stack architecture, TypeScript, React, Next.js, Node.js, NestJS, relational SQL databases, AWS cloud deployments, and CI/CD pipelines. Proven track record of shipping scalable, test-driven applications with high availability.`;
    }

    if (this.geminiApiKey) {
      try {
        const geminiResult = await this.generateCoverLetterWithGemini(
          roleTitle,
          companyName,
          jobDescription,
          resumeText,
          tone,
          format,
          dto.key_achievements,
        );
        if (geminiResult) {
          return {
            ...geminiResult,
            company_name: companyName,
            role_title: roleTitle,
            tone,
            format,
            generated_with: 'Google Gemini 1.5 Flash (AI Engine)',
          };
        }
      } catch (err: any) {
        this.logger.warn(`Gemini Cover Letter Generation failed (${err.message}). Falling back to Heuristic Engine.`);
      }
    }

    return this.generateCoverLetterWithFallback(
      roleTitle,
      companyName,
      jobDescription,
      resumeText,
      tone,
      format,
      dto.key_achievements,
    );
  }

  async evaluateInterviewAnswer(userId: string, dto: EvaluateAnswerDto): Promise<AiAnswerEvaluationResult> {
    const question = dto.question.trim();
    const candidateAnswer = dto.candidate_answer.trim();
    const roleTitle = dto.role_title || 'Software Engineer';
    const companyName = dto.company_name || 'Target Company';
    const roundType = dto.round_type || 'TECHNICAL';

    if (this.geminiApiKey) {
      try {
        const geminiResult = await this.evaluateAnswerWithGemini(
          question,
          candidateAnswer,
          roleTitle,
          companyName,
          roundType,
        );
        if (geminiResult) {
          return {
            ...geminiResult,
            generated_with: 'Google Gemini 1.5 Flash (AI Evaluation Model)',
          };
        }
      } catch (err: any) {
        this.logger.warn(`Gemini Interview Evaluation failed (${err.message}). Falling back to Heuristic Rubric.`);
      }
    }

    return this.evaluateAnswerWithFallback(
      question,
      candidateAnswer,
      roleTitle,
      companyName,
      roundType,
    );
  }

  async negotiateOfferStrategy(userId: string, dto: NegotiateOfferDto): Promise<AiOfferNegotiationResult> {
    const companyName = dto.company_name;
    const roleTitle = dto.role_title;
    const currentBase = Number(dto.current_base) || 0;
    const currentBonus = Number(dto.current_bonus) || 0;
    const currentEquity = Number(dto.current_equity) || 0;

    let targetBase = dto.target_base ? Number(dto.target_base) : Math.round(currentBase * 1.12);
    let targetBonus = dto.target_bonus ? Number(dto.target_bonus) : Math.round(currentBonus * 1.1);
    let targetEquity = dto.target_equity ? Number(dto.target_equity) : Math.round(currentEquity * 1.15);

    if (this.geminiApiKey) {
      try {
        const geminiResult = await this.negotiateOfferWithGemini(
          companyName,
          roleTitle,
          currentBase,
          currentBonus,
          currentEquity,
          targetBase,
          targetBonus,
          targetEquity,
          dto.currency || 'USD',
          dto.work_mode || 'REMOTE',
          dto.leverage_points,
        );
        if (geminiResult) {
          return {
            ...geminiResult,
            generated_with: 'Google Gemini 1.5 Flash (Negotiation Advisor)',
          };
        }
      } catch (err: any) {
        this.logger.warn(`Gemini Offer Negotiation failed (${err.message}). Falling back to Heuristic Advisor.`);
      }
    }

    return this.negotiateOfferWithFallback(
      companyName,
      roleTitle,
      currentBase,
      currentBonus,
      currentEquity,
      targetBase,
      targetBonus,
      targetEquity,
      dto.currency || 'USD',
      dto.work_mode || 'REMOTE',
      dto.leverage_points,
    );
  }

  async scrapeJobPostingUrl(dto: ScrapeJobUrlDto): Promise<ScrapedJobData> {
    const rawUrl = dto.url.trim();
    let urlObj: URL;
    try {
      urlObj = new URL(rawUrl);
    } catch {
      throw new BadRequestException('Invalid URL format');
    }

    const hostname = urlObj.hostname.replace(/^www\./, '');
    let domainName = hostname.split('.')[0];
    domainName = domainName.charAt(0).toUpperCase() + domainName.slice(1);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const response = await fetch(rawUrl, {
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 JobTrackerBot/1.0',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        this.logger.warn(`Scraping URL returned status ${response.status} for ${rawUrl}`);
        return {
          url: rawUrl,
          company_name: domainName,
          role_title: 'Software Engineer',
          source: hostname,
          extracted_success: false,
        };
      }

      const html = await response.text();
      return this.parseHtmlJobPosting(rawUrl, hostname, html);
    } catch (err: any) {
      this.logger.warn(`Error fetching job URL (${rawUrl}): ${err.message}`);
      return {
        url: rawUrl,
        company_name: domainName,
        role_title: 'Software Engineer',
        source: hostname,
        extracted_success: false,
      };
    }
  }

  private parseHtmlJobPosting(rawUrl: string, hostname: string, html: string): ScrapedJobData {
    // 1. Check for JSON-LD Schema (JobPosting)
    const jsonLdMatch = html.match(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    if (jsonLdMatch) {
      for (const tag of jsonLdMatch) {
        try {
          const jsonContent = tag.replace(/<\/?script[^>]*>/gi, '').trim();
          const parsed = JSON.parse(jsonContent);
          const jobData = Array.isArray(parsed)
            ? parsed.find((item) => item['@type'] === 'JobPosting')
            : parsed['@type'] === 'JobPosting'
            ? parsed
            : parsed['@graph']?.find((item: any) => item['@type'] === 'JobPosting');

          if (jobData) {
            const title = jobData.title || jobData.name;
            const company =
              typeof jobData.hiringOrganization === 'string'
                ? jobData.hiringOrganization
                : jobData.hiringOrganization?.name;
            const location =
              typeof jobData.jobLocation === 'string'
                ? jobData.jobLocation
                : jobData.jobLocation?.address?.addressLocality ||
                  jobData.jobLocation?.address?.streetAddress ||
                  (jobData.jobLocationType === 'TELECOMMUTE' ? 'Remote' : undefined);
            const desc = this.stripHtmlTags(jobData.description || '');

            if (title || company) {
              return {
                url: rawUrl,
                role_title: this.cleanText(title),
                company_name: this.cleanText(company),
                location: this.cleanText(location),
                job_description: desc.slice(0, 3500),
                source: hostname,
                extracted_success: true,
              };
            }
          }
        } catch {
          // ignore JSON parse errors in malformed script tags
        }
      }
    }

    // 2. Extract OpenGraph and Twitter Meta Tags
    const getMeta = (propOrName: string): string | undefined => {
      const match =
        html.match(new RegExp(`<meta\\s+(?:property|name)=["']${propOrName}["']\\s+content=["']([^"']*)["']`, 'i')) ||
        html.match(new RegExp(`<meta\\s+content=["']([^"']*)["']\\s+(?:property|name)=["']${propOrName}["']`, 'i'));
      return match ? match[1] : undefined;
    };

    const ogTitle = getMeta('og:title') || getMeta('twitter:title');
    const ogSiteName = getMeta('og:site_name');
    const ogDesc = getMeta('og:description') || getMeta('twitter:description') || getMeta('description');

    // Extract HTML <title> tag
    const titleTagMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const rawTitle = ogTitle || (titleTagMatch ? titleTagMatch[1] : '');

    // Heuristically extract role and company from title (e.g. "Senior Software Engineer at Stripe", "Full Stack Developer - Acme")
    const { roleTitle, companyName } = this.parseTitleAndCompany(rawTitle, ogSiteName, hostname);

    return {
      url: rawUrl,
      role_title: roleTitle || 'Software Engineer',
      company_name: companyName || (hostname.split('.')[0].charAt(0).toUpperCase() + hostname.split('.')[0].slice(1)),
      location: html.toLowerCase().includes('remote') ? 'Remote' : undefined,
      job_description: ogDesc ? this.cleanText(this.stripHtmlTags(ogDesc)) : undefined,
      source: hostname,
      extracted_success: !!(roleTitle || companyName || ogDesc),
    };
  }

  private parseTitleAndCompany(
    title: string,
    siteName?: string,
    hostname?: string,
  ): { roleTitle?: string; companyName?: string } {
    let clean = this.cleanText(title || '');
    if (!clean) return {};

    // Remove common suffixes like "| Jobs", "| Careers", "Apply Now"
    clean = clean.replace(/\s*\|\s*(Careers|Jobs|Job Board|LinkedIn|Glassdoor|Indeed|Lever|Greenhouse).*/i, '');

    // Check for " at " delimiter (e.g., "Software Engineer at Google")
    if (clean.includes(' at ')) {
      const parts = clean.split(' at ');
      return { roleTitle: parts[0].trim(), companyName: parts[1].trim() };
    }

    // Check for " - " delimiter (e.g., "Google - Software Engineer" or "Software Engineer - Google")
    if (clean.includes(' - ')) {
      const parts = clean.split(' - ');
      if (parts.length === 2) {
        return { roleTitle: parts[0].trim(), companyName: siteName || parts[1].trim() };
      }
    }

    // Check for " | " delimiter
    if (clean.includes(' | ')) {
      const parts = clean.split(' | ');
      return { roleTitle: parts[0].trim(), companyName: siteName || parts[1].trim() };
    }

    return {
      roleTitle: clean,
      companyName: siteName || (hostname ? hostname.split('.')[0] : undefined),
    };
  }

  private stripHtmlTags(str: string): string {
    return str
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  private cleanText(str?: string): string | undefined {
    if (!str) return undefined;
    return str.replace(/\s+/g, ' ').trim();
  }

  private async generateInterviewPrepWithGemini(
    roleTitle: string,
    companyName: string,
    jobDescription: string,
    resumeText: string,
    roundType: InterviewRoundType,
    focusAreas?: string[],
  ): Promise<{ questions: InterviewQuestion[]; general_interview_tips: string[] } | null> {
    const prompt = `
You are a Principal Tech Lead and Senior Hiring Manager at a top-tier tech company.
Generate 5 comprehensive, highly realistic practice interview questions tailored to the following role, company, job requirements, and candidate profile.

Target Role: ${roleTitle}
Company: ${companyName}
Interview Format / Round Type: ${roundType}
Focus Areas: ${focusAreas && focusAreas.length > 0 ? focusAreas.join(', ') : 'Core technical & behavioral competencies'}

Job Description:
${jobDescription}

Candidate Profile / Resume Summary:
${resumeText}

Requirements:
- Provide 5 structured interview questions.
- Categorize each question into: "TECHNICAL", "BEHAVIORAL", "SYSTEM_DESIGN", or "EXPERIENCE".
- Include a "context_or_why_asked" explaining why interviewers ask this and what signals they look for.
- Include a "sample_answer_framework" providing the recommended structure (e.g. STAR method for behavioral, architectural trade-offs for system design, concrete algorithmic or framework concepts for technical).
- Assign a difficulty level: "EASY", "MEDIUM", or "HARD".
- Provide 3 concise "general_interview_tips" specific to interviewing for this role at ${companyName}.

Respond ONLY with a valid JSON object matching this TypeScript structure:
{
  "questions": [
    {
      "id": "q1",
      "category": "TECHNICAL",
      "question": "Question text...",
      "context_or_why_asked": "Interviewer intent...",
      "sample_answer_framework": "STAR structure / key architectural points...",
      "difficulty": "MEDIUM"
    }
  ],
  "general_interview_tips": [
    "Tip 1...",
    "Tip 2...",
    "Tip 3..."
  ]
}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini HTTP Error ${response.status}: ${await response.text()}`);
    }

    const data: any = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) return null;

    const parsed = JSON.parse(candidateText);
    return {
      questions: Array.isArray(parsed.questions) ? parsed.questions : [],
      general_interview_tips: Array.isArray(parsed.general_interview_tips) ? parsed.general_interview_tips : [],
    };
  }

  private generateInterviewPrepWithFallback(
    roleTitle: string,
    companyName: string,
    jobDescription: string,
    resumeText: string,
    roundType: InterviewRoundType,
    focusAreas?: string[],
  ): AiInterviewPrepResult {
    const jdLower = jobDescription.toLowerCase();
    const matchedSkills = this.techSkillsDictionary.filter((s) => jdLower.includes(s.toLowerCase()));
    const primarySkill = matchedSkills[0] || 'TypeScript & Node.js';
    const secondarySkill = matchedSkills[1] || 'PostgreSQL & Relational Data Modeling';
    const cloudSkill = matchedSkills.find((s) => ['AWS', 'Docker', 'Kubernetes'].includes(s)) || 'AWS & Containerization';

    const questions: InterviewQuestion[] = [];

    if (roundType === InterviewRoundType.TECHNICAL || roundType === InterviewRoundType.MIXED) {
      questions.push({
        id: 'q1',
        category: 'TECHNICAL',
        question: `How do you manage asynchronous state, concurrency, and error boundaries when building large-scale applications using ${primarySkill}?`,
        context_or_why_asked: `Evaluates your deep understanding of runtime performance, promise handling, and robust exception propagation in production.`,
        sample_answer_framework: `1. Explain async flow and memory management.\n2. Discuss global error filters / interceptors.\n3. Mention telemetry, structured logging, and retry backoff strategies.`,
        difficulty: 'MEDIUM',
      });

      questions.push({
        id: 'q2',
        category: 'TECHNICAL',
        question: `Walk me through your strategy for database schema evolution, indexing strategies, and query optimization when working with ${secondarySkill}.`,
        context_or_why_asked: `Tests your ability to prevent production outages, write zero-downtime migrations (e.g. Flyway), and optimize slow queries using composite indexes and execution plans.`,
        sample_answer_framework: `1. Migration safety: additive changes first, backfilling, then dropping deprecated columns.\n2. Indexing: B-Tree vs GIN indexes, indexing foreign keys and filtered queries.\n3. Connection pooling and transaction isolation levels.`,
        difficulty: 'HARD',
      });
    }

    if (roundType === InterviewRoundType.SYSTEM_DESIGN || roundType === InterviewRoundType.MIXED) {
      questions.push({
        id: 'q3',
        category: 'SYSTEM_DESIGN',
        question: `How would you architect a resilient, highly available background task processing pipeline at ${companyName} utilizing ${cloudSkill}?`,
        context_or_why_asked: `Assesses your end-to-end system design skills, trade-off analysis between synchronous vs message queue architectures (SQS/Kafka/Redis), and rate limiting.`,
        sample_answer_framework: `1. High-level architecture: API Gateway -> Microservice -> Queue -> Worker Pool.\n2. Idempotency: using deduplication keys in PostgreSQL / Redis.\n3. Dead-letter queues (DLQ), alerting, and graceful shutdown handling.`,
        difficulty: 'HARD',
      });
    }

    if (roundType === InterviewRoundType.BEHAVIORAL || roundType === InterviewRoundType.MIXED) {
      questions.push({
        id: 'q4',
        category: 'BEHAVIORAL',
        question: `Describe a scenario where you faced conflicting technical opinions on architecture or library choice with a senior engineer. How did you reach alignment?`,
        context_or_why_asked: `Evaluates leadership, emotional intelligence, and collaborative decision making using objective data and ADRs (Architecture Decision Records).`,
        sample_answer_framework: `STAR Method:\n- Situation: Describe the project and conflicting viewpoint.\n- Task: The decision deadline and business impact.\n- Action: Built a quick POC / benchmarked performance metrics objectively.\n- Result: Team alignment achieved with documented rationale and on-time delivery.`,
        difficulty: 'MEDIUM',
      });

      questions.push({
        id: 'q5',
        category: 'EXPERIENCE',
        question: `Why are you interested in joining ${companyName} as a ${roleTitle}, and how does your past background uniquely prepare you for our technical challenges?`,
        context_or_why_asked: `Checks genuine company research, culture fit, and clarity in connecting past wins with ${companyName}'s current engineering vision.`,
        sample_answer_framework: `1. Specific praise for ${companyName}'s product or engineering culture.\n2. Bridge 2 major achievements from your previous projects that solve similar problems.\n3. Reiterate your eagerness to contribute from day one.`,
        difficulty: 'EASY',
      });
    }

    if (roundType === InterviewRoundType.BEHAVIORAL && questions.length < 5) {
      questions.push(
        {
          id: 'q6',
          category: 'BEHAVIORAL',
          question: `Tell me about a time when a production incident occurred on code you shipped. How did you triage, resolve, and prevent it from reoccurring?`,
          context_or_why_asked: `Assesses ownership, calmness under pressure, and post-mortem blameless culture.`,
          sample_answer_framework: `STAR Method: Quick containment -> Root cause analysis -> Hotfix -> Post-mortem RCA with added automated regression tests.`,
          difficulty: 'MEDIUM',
        },
        {
          id: 'q7',
          category: 'BEHAVIORAL',
          question: `How do you prioritize your time when facing competing urgent deadlines across multiple sprint deliverables?`,
          context_or_why_asked: `Evaluates communication with stakeholders, trade-off clarity, and scope negotiation.`,
          sample_answer_framework: `1. Impact vs effort matrix.\n2. Transparent stakeholder updates.\n3. Delivering incremental high-value MVPs.`,
          difficulty: 'EASY',
        },
      );
    }

    return {
      role_title: roleTitle,
      company_name: companyName,
      round_type: roundType,
      questions: questions.slice(0, 5),
      general_interview_tips: [
        `Structure your answers with the STAR method for behavioral questions and structured requirements breakdown for technical rounds.`,
        `Ask clarifying questions regarding scale, throughput, and error tolerance before proposing system architecture.`,
        `Highlight testing practices (unit tests, integration tests, CI/CD) and monitoring metrics you set up in past projects.`,
      ],
      generated_with: 'Smart Semantic Engine (Local Fallback)',
    };
  }

  private async generateEmailWithGemini(
    dto: GenerateEmailDto,
    candidateName: string,
  ): Promise<{ subject: string; body: string } | null> {
    const prompt = `
You are an expert career advisor and technical recruiter.
Generate a professional email communication for a job application based on the following parameters:

Communication Type: ${dto.type}
Target Company: ${dto.company_name}
Target Role: ${dto.role_title}
Recipient Name: ${dto.recipient_name || 'Hiring Manager'}
Desired Tone: ${dto.tone || 'PROFESSIONAL'}
Candidate Name: ${candidateName}
Additional Talking Points / Notes: ${dto.extra_notes || 'None provided'}

Guidelines:
- If type is FOLLOW_UP: polite check-in on the status of the submitted application, reiterating enthusiasm and fit.
- If type is THANK_YOU: thank the interviewer, highlight key discussion points, and reaffirm excitement.
- If type is COLD_OUTREACH: concise message introducing yourself, why you admire the company, and asking for a brief chat or referral.
- If type is OFFER_NEGOTIATION: professional and gracious negotiation expressing excitement for the offer while discussing compensation alignment.

Respond ONLY with a valid JSON object matching this structure:
{
  "subject": "<Compelling Email Subject Line>",
  "body": "<Well-formatted email body with greeting, paragraphs, and sign-off>"
}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini HTTP Error ${response.status}: ${await response.text()}`);
    }

    const data: any = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) return null;

    const parsed = JSON.parse(candidateText);
    return {
      subject: parsed.subject || `Regarding ${dto.role_title} Application at ${dto.company_name}`,
      body: parsed.body || '',
    };
  }

  private generateEmailWithTemplates(dto: GenerateEmailDto, candidateName: string): AiEmailResult {
    const recipient = dto.recipient_name || 'Hiring Team';
    const company = dto.company_name;
    const role = dto.role_title;
    const tone = dto.tone || EmailTone.PROFESSIONAL;

    let subject = '';
    let body = '';

    switch (dto.type) {
      case EmailType.FOLLOW_UP:
        subject = `Following Up: Application for ${role} – ${candidateName}`;
        body = `Hi ${recipient},

I hope you are having a productive week.

I am writing to follow up on my recent application for the ${role} position at ${company}. I remain deeply excited about the opportunity to contribute to your team's engineering goals${dto.extra_notes ? `, especially regarding ${dto.extra_notes}` : ''}.

Please let me know if you need any additional portfolio samples, references, or details from my end. I look forward to hearing from you.

Best regards,
${candidateName}`;
        break;

      case EmailType.THANK_YOU:
        subject = `Thank You – ${role} Interview | ${candidateName}`;
        body = `Dear ${recipient},

Thank you for taking the time to speak with me today regarding the ${role} role at ${company}.

I truly enjoyed our discussion about the engineering roadmap, technical architecture, and team culture${dto.extra_notes ? ` (especially our conversation around ${dto.extra_notes})` : ''}. Our conversation further confirmed my enthusiasm for joining ${company}.

Please don't hesitate to reach out if you have any follow-up questions. I look forward to the next steps.

Sincerely,
${candidateName}`;
        break;

      case EmailType.COLD_OUTREACH:
        subject = `Interested in ${role} Opportunities at ${company} – ${candidateName}`;
        body = `Hi ${recipient},

I hope this message finds you well.

I have been following ${company}'s impressive engineering milestones and wanted to reach out regarding potential opportunities on your team for the ${role} role${dto.extra_notes ? ` (${dto.extra_notes})` : ''}.

With hands-on experience in full-stack cloud systems, TypeScript, and distributed applications, I would love the chance to connect for a quick 10-minute chat to learn more about your upcoming technical priorities.

Thank you for your time and consideration!

Warm regards,
${candidateName}`;
        break;

      case EmailType.OFFER_NEGOTIATION:
        subject = `Offer Discussion: ${role} – ${candidateName}`;
        body = `Dear ${recipient},

Thank you very much for offering me the ${role} position at ${company}! I am genuinely excited about the prospect of joining the team and contributing to your upcoming milestones.

Before making my final decision, I would like to discuss the compensation package${dto.extra_notes ? `, specifically regarding ${dto.extra_notes}` : ' to ensure alignment with market standards for this role'}. Based on my background and the value I can deliver from day one, is there flexibility on the base salary or equity component?

I am eager to find a mutually beneficial arrangement and would appreciate a brief call to discuss.

Best regards,
${candidateName}`;
        break;
    }

    return {
      subject,
      body,
      type: dto.type,
      tone,
      generated_with: 'Smart Template Engine (Offline Fallback)',
    };
  }

  private async analyzeWithGemini(
    jobDescription: string,
    resumeText: string,
    roleTitle?: string,
    companyName?: string,
  ): Promise<Omit<AiMatchResult, 'analyzed_with'> | null> {
    const prompt = `
You are an expert technical recruiter and ATS (Applicant Tracking System) specialist.
Analyze the following Job Description against the Candidate's Resume.

Job Description:
${jobDescription}

Role Title: ${roleTitle || 'Unspecified'}
Company: ${companyName || 'Unspecified'}

Candidate Resume / Profile:
${resumeText}

Respond ONLY with a valid JSON object matching this exact TypeScript structure:
{
  "score": <number between 0 and 100 representing ATS match percentage>,
  "verdict": <"STRONG_MATCH" if score >= 80, "MODERATE_MATCH" if score between 60 and 79, or "NEEDS_IMPROVEMENT" if score < 60>,
  "matched_skills": [<array of skills present in both JD and resume>],
  "missing_skills": [<array of key skills/qualifications in the JD that are absent or under-emphasized in the resume>],
  "recommendations": [<array of 3-4 specific, actionable resume tailoring tips>],
  "interview_focus_areas": [<array of 3-4 likely technical/behavioral interview questions based on the gaps or required competencies>],
  "summary": "<1-2 sentence executive assessment>"
}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini HTTP Error ${response.status}: ${await response.text()}`);
    }

    const data: any = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) return null;

    const parsed = JSON.parse(candidateText);
    return {
      score: Math.min(100, Math.max(0, Number(parsed.score) || 75)),
      verdict: parsed.verdict || (parsed.score >= 80 ? 'STRONG_MATCH' : parsed.score >= 60 ? 'MODERATE_MATCH' : 'NEEDS_IMPROVEMENT'),
      matched_skills: Array.isArray(parsed.matched_skills) ? parsed.matched_skills : [],
      missing_skills: Array.isArray(parsed.missing_skills) ? parsed.missing_skills : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      interview_focus_areas: Array.isArray(parsed.interview_focus_areas) ? parsed.interview_focus_areas : [],
      summary: parsed.summary || 'AI evaluation complete.',
    };
  }

  private analyzeWithSemanticParser(
    jobDescription: string,
    resumeText: string,
    roleTitle?: string,
    companyName?: string,
    resumeLabel?: string,
  ): AiMatchResult {
    const jdLower = jobDescription.toLowerCase();
    const resumeLower = (resumeText + ' ' + (roleTitle || '')).toLowerCase();

    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    this.techSkillsDictionary.forEach((skill) => {
      const skillLower = skill.toLowerCase();
      const inJd = jdLower.includes(skillLower);
      const inResume = resumeLower.includes(skillLower);

      if (inJd && inResume) {
        matchedSkills.push(skill);
      } else if (inJd && !inResume) {
        missingSkills.push(skill);
      }
    });

    const totalFoundInJd = matchedSkills.length + missingSkills.length;
    let calculatedScore = 78;

    if (totalFoundInJd > 0) {
      const ratio = matchedSkills.length / totalFoundInJd;
      calculatedScore = Math.round(50 + ratio * 45);
    }

    let verdict: 'STRONG_MATCH' | 'MODERATE_MATCH' | 'NEEDS_IMPROVEMENT' = 'MODERATE_MATCH';
    if (calculatedScore >= 80) verdict = 'STRONG_MATCH';
    else if (calculatedScore < 60) verdict = 'NEEDS_IMPROVEMENT';

    const recommendations: string[] = [
      missingSkills.length > 0
        ? `Explicitly mention keywords: ${missingSkills.slice(0, 3).join(', ')} in your project bullet points or skills summary.`
        : 'Highlight measurable metrics (e.g. latency reduced by 40%, user engagement increased) in your experience.',
      `Align your headline with the target role "${roleTitle || 'Software Engineer'}" at ${companyName || 'the company'}.`,
      'Include links to active GitHub repositories demonstrating your full-stack and architectural capabilities.',
    ];

    const interviewFocusAreas: string[] = [
      `System Design: Architecting scalable REST/Microservice systems with ${matchedSkills[0] || 'Node.js'} and ${matchedSkills[1] || 'PostgreSQL'}.`,
      `Database Optimization: Indexing, transactions, and migration strategies (Flyway / Prisma).`,
      `Hands-on Coding: Live algorithmic problem-solving and clean asynchronous TypeScript patterns.`,
    ];

    return {
      score: calculatedScore,
      verdict,
      matched_skills: matchedSkills.length > 0 ? matchedSkills : ['TypeScript', 'Node.js', 'REST API'],
      missing_skills: missingSkills.slice(0, 5),
      recommendations,
      interview_focus_areas: interviewFocusAreas,
      summary: `Your resume (${resumeLabel || 'Candidate'}) shows a ${calculatedScore}% compatibility with the ${roleTitle || 'target'} role. Adding missing keyword competencies will maximize ATS passing rates.`,
      analyzed_with: 'Smart Semantic Engine (Local Fallback)',
    };
  }

  private async generateCoverLetterWithGemini(
    roleTitle: string,
    companyName: string,
    jobDescription: string,
    resumeText: string,
    tone: CoverLetterTone,
    format: CoverLetterFormat,
    keyAchievements?: string,
  ): Promise<Omit<AiCoverLetterResult, 'company_name' | 'role_title' | 'tone' | 'format' | 'generated_with'> | null> {
    const isPitch = format === CoverLetterFormat.LINKEDIN_INMAIL_PITCH;
    const prompt = `
You are an expert executive career coach and technical hiring consultant.
Write a compelling, tailored ${isPitch ? 'LinkedIn Recruiter InMail outreach pitch (under 160 words)' : 'job application Cover Letter (3-4 concise markdown paragraphs)'}.

TARGET ROLE: ${roleTitle}
COMPANY: ${companyName}
DESIRED TONE: ${tone}
${keyAchievements ? `CANDIDATE KEY ACHIEVEMENTS TO EMPHASIZE:\n${keyAchievements}\n` : ''}
${jobDescription ? `JOB DESCRIPTION EXCERPT:\n${jobDescription.slice(0, 1500)}\n` : ''}
CANDIDATE BACKGROUND / RESUME EXCERPT:
${resumeText.slice(0, 2000)}

REQUIREMENTS:
1. Make it authentic, persuasive, and directly address the company's domain or technical requirements.
2. Emphasize measurable achievements and architectural ownership.
3. Output STRICTLY a valid JSON object with NO markdown ticks or backticks outside of JSON.
Schema:
{
  "title": "${isPitch ? `InMail Outreach: ${roleTitle} at ${companyName}` : `Cover Letter: ${roleTitle} - ${companyName}`}",
  "content": "Full markdown text of the letter or InMail pitch",
  "word_count": 280,
  "estimated_reading_minutes": 1.5,
  "key_selling_points": ["Point 1", "Point 2", "Point 3"]
}
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) return null;
    const data: any = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) return null;

    const parsed = JSON.parse(candidateText);
    const content = parsed.content || '';
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    return {
      title: parsed.title || `Cover Letter: ${roleTitle} - ${companyName}`,
      content,
      word_count: wordCount,
      estimated_reading_minutes: Math.max(1, Math.round(wordCount / 200 * 10) / 10),
      key_selling_points: Array.isArray(parsed.key_selling_points) ? parsed.key_selling_points : [],
    };
  }

  private generateCoverLetterWithFallback(
    roleTitle: string,
    companyName: string,
    jobDescription: string,
    resumeText: string,
    tone: CoverLetterTone,
    format: CoverLetterFormat,
    keyAchievements?: string,
  ): AiCoverLetterResult {
    const isPitch = format === CoverLetterFormat.LINKEDIN_INMAIL_PITCH;
    const jdLower = jobDescription.toLowerCase();
    const matchedSkills = this.techSkillsDictionary.filter((s) => jdLower.includes(s.toLowerCase()));
    const primarySkill = matchedSkills[0] || 'TypeScript & Node.js';
    const secondarySkill = matchedSkills[1] || 'Modern Frontend Architecture & Cloud Services';

    let content = '';
    const title = isPitch
      ? `InMail Pitch: ${roleTitle} at ${companyName}`
      : `Application for ${roleTitle} at ${companyName}`;

    if (isPitch) {
      if (tone === CoverLetterTone.ENTHUSIASTIC) {
        content = `Hi [Recruiter / Hiring Team],\n\nI’ve been closely following ${companyName}’s engineering growth and was thrilled to see the **${roleTitle}** opening! With deep experience in **${primarySkill}** and **${secondarySkill}**, I specialize in shipping high-throughput systems that scale reliably.\n\n${keyAchievements ? `Recently, I ${keyAchievements}.\n\n` : ''}I’d love to connect for 10 minutes to discuss how my technical background aligns with ${companyName}'s roadmap this quarter. Are you free for a brief chat this week?\n\nBest regards,\n[Your Name]`;
      } else if (tone === CoverLetterTone.CONFIDENT) {
        content = `Hi [Hiring Manager],\n\nI am reaching out regarding the **${roleTitle}** position at ${companyName}. Over the past few years, I have architected high-performance applications leveraging **${primarySkill}** and **${secondarySkill}**, driving tangible reliability and product velocity.\n\n${keyAchievements ? `Key highlight: ${keyAchievements}.\n\n` : ''}I believe I can bring immediate value to your engineering sprints. When would be a good time for a quick 10-minute introductory call?\n\nBest,\n[Your Name]`;
      } else {
        content = `Hi [Recruiter Name],\n\nI hope you're having a great week. I’m writing to express my strong interest in the **${roleTitle}** role at **${companyName}**.\n\nMy background is centered around building resilient full-stack systems with **${primarySkill}** and **${secondarySkill}**. ${keyAchievements ? `A key achievement of mine: ${keyAchievements}.` : 'I have a proven record of leading technical deliveries from concept to production.'}\n\nI would welcome the opportunity to connect and discuss how my skills match your team’s current priorities. Thank you for your time!\n\nSincerely,\n[Your Name]`;
      }
    } else {
      // Full Cover Letter
      content = `Dear Hiring Team at ${companyName},\n\nI am writing to express my enthusiastic interest in the **${roleTitle}** role at **${companyName}**. With hands-on experience designing, developing, and deploying resilient software applications utilizing **${primarySkill}** and **${secondarySkill}**, I am eager to contribute to your engineering team's mission.\n\nThroughout my work, I have focused on writing clean, test-driven, and highly maintainable code. ${keyAchievements ? `Specifically, ${keyAchievements}. ` : ''}Whether designing scalable microservices or optimizing responsive user interfaces, I prioritize product reliability, developer ergonomics, and user satisfaction.\n\nWhat excites me most about ${companyName} is your commitment to technical innovation and engineering excellence. I am confident that my background in distributed systems, asynchronous pipelines, and collaborative problem-solving makes me a strong fit for this team.\n\nThank you for considering my application. I welcome the opportunity to discuss how my technical experience and enthusiasm can support ${companyName}'s upcoming goals.\n\nWarm regards,\n\n**[Your Name]**\n[LinkedIn Profile / Portfolio]`;
    }

    const wordCount = content.split(/\s+/).filter(Boolean).length;

    return {
      title,
      content,
      format,
      tone,
      company_name: companyName,
      role_title: roleTitle,
      word_count: wordCount,
      estimated_reading_minutes: Math.max(1, Math.round(wordCount / 200 * 10) / 10),
      key_selling_points: [
        `Targeted alignment with ${primarySkill} & ${secondarySkill}`,
        `Clear presentation of engineering ownership & measurable impact`,
        `Polite, conversion-focused closing call-to-action for interviews`,
      ],
      generated_with: 'Smart Pitch Synthesizer (Local Fallback)',
    };
  }

  private async evaluateAnswerWithGemini(
    question: string,
    candidateAnswer: string,
    roleTitle: string,
    companyName: string,
    roundType: string,
  ): Promise<Omit<AiAnswerEvaluationResult, 'generated_with'> | null> {
    const prompt = `
You are a senior hiring bar raiser and technical interview coach at a top-tier software company.
Evaluate the candidate's interview practice answer according to the STAR method (Situation, Task, Action, Result).

QUESTION: "${question}"
TARGET ROLE: ${roleTitle} at ${companyName}
INTERVIEW ROUND: ${roundType}
CANDIDATE ANSWER:
"${candidateAnswer}"

CRITERIA:
- Score from 0 to 100 based on clarity, specificity, concrete metrics, technical depth, and STAR structure.
- Check each STAR component (Situation, Task, Action, Result) with boolean and a 1-sentence assessment.
- Provide 2-3 specific strengths.
- Provide 2-3 actionable areas to improve.
- Write a polished, model 1-paragraph revision of their answer demonstrating how to phrase it with maximum impact.

Output STRICTLY valid JSON with NO markdown backticks:
{
  "score": 85,
  "verdict": "EXCELLENT" | "SOLID" | "NEEDS_WORK",
  "star_breakdown": {
    "situation": { "present": true, "comment": "Clear context given about the legacy system." },
    "task": { "present": true, "comment": "Clearly identified the latency bottleneck as the core task." },
    "action": { "present": true, "comment": "Described indexing and cache invalidation steps in detail." },
    "result": { "present": true, "comment": "Cited a 45% reduction in API response times." }
  },
  "strengths": ["Clear technical terminology", "Good structure"],
  "improvements": ["Elaborate on how trade-offs were evaluated", "Mention team collaboration"],
  "improved_answer": "Model refined answer..."
}
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      }),
    });

    if (!response.ok) return null;
    const data: any = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) return null;

    return JSON.parse(candidateText);
  }

  private evaluateAnswerWithFallback(
    question: string,
    candidateAnswer: string,
    roleTitle: string,
    companyName: string,
    roundType: string,
  ): AiAnswerEvaluationResult {
    const words = candidateAnswer.split(/\s+/).filter(Boolean).length;
    const lower = candidateAnswer.toLowerCase();

    // Check STAR cues
    const hasSituation = lower.includes('when') || lower.includes('at') || lower.includes('project') || lower.includes('company') || lower.includes('team');
    const hasTask = lower.includes('needed to') || lower.includes('task') || lower.includes('goal') || lower.includes('responsible') || lower.includes('problem');
    const hasAction = lower.includes('i built') || lower.includes('i implemented') || lower.includes('i designed') || lower.includes('i resolved') || lower.includes('i led') || lower.includes('i created') || lower.includes('i optimized');
    const hasResult = lower.includes('result') || lower.includes('reduced') || lower.includes('improved') || lower.includes('%') || lower.includes('increased') || lower.includes('delivered') || lower.includes('achieved');

    let baseScore = 65;
    if (words >= 40 && words <= 250) baseScore += 10;
    if (hasSituation) baseScore += 5;
    if (hasTask) baseScore += 5;
    if (hasAction) baseScore += 10;
    if (hasResult) baseScore += 10;
    if (baseScore > 95) baseScore = 95;

    let verdict: 'EXCELLENT' | 'SOLID' | 'NEEDS_WORK' = 'SOLID';
    if (baseScore >= 85) verdict = 'EXCELLENT';
    else if (baseScore < 70) verdict = 'NEEDS_WORK';

    const strengths: string[] = [];
    const improvements: string[] = [];

    if (hasAction) {
      strengths.push('Demonstrates direct personal ownership with clear action verbs.');
    } else {
      improvements.push('Clarify your specific individual contribution ("I implemented...") rather than vague team efforts.');
    }

    if (hasResult) {
      strengths.push('Highlights tangible outcomes and business or performance impact.');
    } else {
      improvements.push('Quantify the final result with concrete metrics (e.g. % speedup, error rate decrease, or stakeholder satisfaction).');
    }

    if (words < 40) {
      improvements.push('Your answer is quite brief. Add more technical context and step-by-step reasoning.');
    } else if (words > 250) {
      improvements.push('Keep the answer concise (approx. 90-180 seconds spoken length) to maintain interviewer engagement.');
    } else {
      strengths.push('Well-balanced answer length suitable for a 2-minute response window.');
    }

    const improvedAnswer = `In a previous project as a ${roleTitle}, we faced a key challenge where our team needed to ensure high reliability and low latency for user-facing APIs. I took ownership by architecting a structured solution using modern asynchronous patterns, adding comprehensive integration tests, and optimizing database queries. As a result, we successfully reduced p99 latency by 35% and delivered the feature on schedule with zero production incidents.`;

    return {
      score: baseScore,
      verdict,
      star_breakdown: {
        situation: {
          present: hasSituation,
          comment: hasSituation ? 'Provides appropriate background context.' : 'Missing clear framing of the initial situation/context.',
        },
        task: {
          present: hasTask,
          comment: hasTask ? 'Clearly outlines the core objective or problem.' : 'Could more explicitly define what your exact goal was.',
        },
        action: {
          present: hasAction,
          comment: hasAction ? 'Strong emphasis on technical execution and decisions.' : 'Add more active verbs showing your exact technical actions.',
        },
        result: {
          present: hasResult,
          comment: hasResult ? 'Concludes with measurable impact and learnings.' : 'Conclude with quantifiable impact or business results.',
        },
      },
      strengths: strengths.length > 0 ? strengths : ['Good initial foundation', 'Clear focus on topic'],
      improvements: improvements.length > 0 ? improvements : ['Maintain confidence and practice speaking rhythm.'],
      improved_answer: improvedAnswer,
      generated_with: 'STAR Heuristic Coach (Local Fallback)',
    };
  }

  private async negotiateOfferWithGemini(
    companyName: string,
    roleTitle: string,
    currentBase: number,
    currentBonus: number,
    currentEquity: number,
    targetBase: number,
    targetBonus: number,
    targetEquity: number,
    currency: string,
    workMode: string,
    leveragePoints?: string,
  ): Promise<Omit<AiOfferNegotiationResult, 'generated_with'> | null> {
    const currentTotal = currentBase + currentBonus + currentEquity;
    const targetTotal = targetBase + targetBonus + targetEquity;
    const increasePercent = currentTotal > 0 ? Math.round(((targetTotal - currentTotal) / currentTotal) * 100) : 12;

    const prompt = `
You are a world-class executive compensation negotiator and career advisor.
Create a strategic counter-offer plan and diplomatic email draft for a candidate negotiating an offer.

ROLE: ${roleTitle}
COMPANY: ${companyName}
CURRENT OFFER: ${currency} ${currentBase.toLocaleString()} Base, ${currency} ${currentBonus.toLocaleString()} Bonus, ${currency} ${currentEquity.toLocaleString()} Equity (Total: ${currency} ${currentTotal.toLocaleString()})
TARGET COUNTER: ${currency} ${targetBase.toLocaleString()} Base, ${currency} ${targetBonus.toLocaleString()} Bonus, ${currency} ${targetEquity.toLocaleString()} Equity (Total: ${currency} ${targetTotal.toLocaleString()}, +${increasePercent}%)
WORK MODE: ${workMode}
${leveragePoints ? `CANDIDATE LEVERAGE POINTS:\n${leveragePoints}` : ''}

REQUIREMENTS:
1. Provide a concise strategic summary of how to frame the counter.
2. Outline 3 high-impact talking points focusing on market value and candidate enthusiasm.
3. Write a verbal phone call script (under 120 words) for when discussing with the recruiter.
4. Write a formal, enthusiastic counter-offer email draft that politely proposes the revised numbers without issuing an ultimatum.
5. Determine risk level (LOW, MEDIUM, HIGH) based on the ask.

Output STRICTLY valid JSON with NO markdown backticks:
{
  "strategy_summary": "Summary of negotiation leverage and angle",
  "recommended_counter": {
    "base_salary": ${targetBase},
    "bonus": ${targetBonus},
    "equity": ${targetEquity},
    "total_comp": ${targetTotal},
    "increase_percentage": ${increasePercent}
  },
  "talking_points": ["Point 1", "Point 2", "Point 3"],
  "phone_script": "Verbal script text...",
  "counter_email_draft": "Email body text...",
  "risk_level": "LOW",
  "key_leverage_summary": ["Leverage 1", "Leverage 2"]
}
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.4,
        },
      }),
    });

    if (!response.ok) return null;
    const data: any = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) return null;

    return JSON.parse(candidateText);
  }

  private negotiateOfferWithFallback(
    companyName: string,
    roleTitle: string,
    currentBase: number,
    currentBonus: number,
    currentEquity: number,
    targetBase: number,
    targetBonus: number,
    targetEquity: number,
    currency: string,
    workMode: string,
    leveragePoints?: string,
  ): AiOfferNegotiationResult {
    const currentTotal = currentBase + currentBonus + currentEquity;
    const targetTotal = targetBase + targetBonus + targetEquity;
    const increasePercent = currentTotal > 0 ? Math.round(((targetTotal - currentTotal) / currentTotal) * 100) : 10;

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (increasePercent > 20) riskLevel = 'HIGH';
    else if (increasePercent > 12) riskLevel = 'MEDIUM';

    const talkingPoints = [
      `Enthusiastic Alignment: Reiterate that ${companyName} is your top choice and you are thrilled by the team's engineering roadmap.`,
      `Market & Scope Anchor: Position your request for ${currency} ${targetBase.toLocaleString()} base around your proven ability to deliver immediate value in the ${roleTitle} role.`,
      `Flexibility & Collaboration: Show willingness to explore a mix of base salary, sign-on bonus, or equity refreshers to reach target alignment.`,
    ];

    const phoneScript = `"Thank you so much for extending the offer to join ${companyName} as a ${roleTitle}. I'm genuinely excited about the team and the impact we can make. After reviewing the complete compensation details and considering market benchmarks for this level of technical responsibility, I was hoping we could discuss bringing the base salary closer to ${currency} ${targetBase.toLocaleString()} (or exploring an adjusted sign-on / equity package). If we can bridge this gap, I would be thrilled to sign and accept right away."`;

    const counterEmailDraft = `Subject: ${roleTitle} Offer - Compensation Discussion & Next Steps - [Your Name]

Dear [Recruiter / Hiring Manager Name],

Thank you so much for putting together this offer. I am genuinely thrilled about the opportunity to join ${companyName} as a ${roleTitle} and contribute to your team's upcoming initiatives.

After reviewing the package in detail and reflecting on market standards for this scope of ownership, I was hoping we could explore an adjustment to the overall compensation. Specifically, I would love to see if we can bring the base salary to **${currency} ${targetBase.toLocaleString()}**${targetBonus > currentBonus ? ` with a performance target of **${currency} ${targetBonus.toLocaleString()}**` : ''}${targetEquity > currentEquity ? ` and equity valued at **${currency} ${targetEquity.toLocaleString()}**` : ''}.

${leveragePoints ? `For context, ${leveragePoints}.\n\n` : ''}I am very eager to make this work, and with these adjustments in place, I would be ready to accept immediately and begin onboarding.

Could we schedule a quick 10-minute call this week to discuss? Thank you again for your continued support throughout the interview process.

Warm regards,

**[Your Name]**
[Phone Number] | [LinkedIn Profile]`;

    return {
      strategy_summary: `Your counter represents a ${increasePercent}% increase over the initial offer. By anchoring on specific value metrics and stating that you are ready to sign immediately upon adjustment, you maximize recruiter willingness to advocate for compensation committee approval.`,
      recommended_counter: {
        base_salary: targetBase,
        bonus: targetBonus,
        equity: targetEquity,
        total_comp: targetTotal,
        increase_percentage: increasePercent,
      },
      talking_points: talkingPoints,
      phone_script: phoneScript,
      counter_email_draft: counterEmailDraft,
      risk_level: riskLevel,
      key_leverage_summary: [
        `Clear sign-now commitment if target is met`,
        `Balanced distribution between base and variable compensation`,
        `Professional, non-adversarial framing that preserves goodwill`,
      ],
      generated_with: 'Negotiation Strategy Engine (Local Heuristic)',
    };
  }

  async parseJobText(
    userId: string,
    dto: ParseJobTextDto,
  ): Promise<ParsedJobTextResult> {
    const rawText = dto.text?.trim();
    if (!rawText || rawText.length < 15) {
      throw new BadRequestException('Job posting text must be at least 15 characters long');
    }

    if (this.geminiApiKey) {
      try {
        const geminiResult = await this.parseJobTextWithGemini(rawText);
        if (geminiResult) {
          return {
            ...geminiResult,
            extracted_with: 'Google Gemini AI',
          };
        }
      } catch (err: any) {
        this.logger.warn(`Gemini Job Parsing failed, falling back to heuristic parser: ${err.message}`);
      }
    }

    return this.parseJobTextWithFallback(rawText);
  }

  private async parseJobTextWithGemini(rawText: string): Promise<ParsedJobTextResult | null> {
    const prompt = `You are an expert AI recruiting assistant and job description parser.
Extract structured job details from the following raw job posting text.

Job Posting Text:
"""
${rawText}
"""

Return ONLY a valid, parseable JSON object matching this exact TypeScript interface without any markdown backticks or commentary:
{
  "company_name": string or null,
  "role_title": string or null,
  "work_mode": "REMOTE" | "HYBRID" | "ONSITE",
  "location": string or null,
  "salary_min": number or null,
  "salary_max": number or null,
  "currency": string or null,
  "contact_name": string or null,
  "contact_email": string or null,
  "key_skills": string[],
  "job_summary": string
}`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) return null;
    const data: any = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) return null;

    return JSON.parse(candidateText);
  }

  private parseJobTextWithFallback(rawText: string): ParsedJobTextResult {
    // 1. Email extraction
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
    const emailMatch = rawText.match(emailRegex);
    const contactEmail = emailMatch ? emailMatch[1] : undefined;

    // 2. Work mode extraction
    let workMode: 'REMOTE' | 'HYBRID' | 'ONSITE' = 'REMOTE';
    const lowerText = rawText.toLowerCase();
    if (lowerText.includes('hybrid')) {
      workMode = 'HYBRID';
    } else if (lowerText.includes('on-site') || lowerText.includes('onsite') || lowerText.includes('in-office') || lowerText.includes('in office')) {
      workMode = 'ONSITE';
    } else if (lowerText.includes('remote') || lowerText.includes('wfh') || lowerText.includes('work from home')) {
      workMode = 'REMOTE';
    }

    // 3. Currency and Salary extraction
    let currency = 'USD';
    if (lowerText.includes('lkr') || lowerText.includes('rs.') || lowerText.includes('rupees')) currency = 'LKR';
    else if (lowerText.includes('eur') || lowerText.includes('€')) currency = 'EUR';
    else if (lowerText.includes('gbp') || lowerText.includes('£')) currency = 'GBP';
    else if (lowerText.includes('cad') || lowerText.includes('c$')) currency = 'CAD';
    else if (lowerText.includes('aud') || lowerText.includes('a$')) currency = 'AUD';
    else if (lowerText.includes('inr') || lowerText.includes('₹')) currency = 'INR';

    let salaryMin: number | undefined;
    let salaryMax: number | undefined;

    // Regex for ranges like $120,000 - $160,000 or $120k - $160k or 120,000 to 160,000
    const salaryRangeRegex = /(?:[\$€£₹]\s*)?(\d{2,3}(?:,\d{3})*(?:\.\d+)?|\d{2,3})k?\s*(?:-|–|to)\s*(?:[\$€£₹]\s*)?(\d{2,3}(?:,\d{3})*(?:\.\d+)?|\d{2,3})k?/i;
    const rangeMatch = rawText.match(salaryRangeRegex);
    if (rangeMatch) {
      let num1 = parseFloat(rangeMatch[1].replace(/,/g, ''));
      let num2 = parseFloat(rangeMatch[2].replace(/,/g, ''));
      if (num1 < 1000) num1 *= 1000;
      if (num2 < 1000) num2 *= 1000;
      salaryMin = Math.min(num1, num2);
      salaryMax = Math.max(num1, num2);
    } else {
      // Single salary like $140,000 / year or $150k
      const singleSalaryRegex = /(?:[\$€£₹]\s*)(\d{2,3}(?:,\d{3})*(?:\.\d+)?|\d{2,3})k?/i;
      const singleMatch = rawText.match(singleSalaryRegex);
      if (singleMatch) {
        let num = parseFloat(singleMatch[1].replace(/,/g, ''));
        if (num < 1000) num *= 1000;
        salaryMin = num;
        salaryMax = Math.round(num * 1.15);
      }
    }

    // 4. Role Title & Company extraction heuristic
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    let roleTitle = 'Software Engineer';
    let companyName = 'Hiring Company';
    let location: string | undefined;

    if (lines.length > 0) {
      const firstLine = lines[0];
      const atMatch = firstLine.match(/^(.*?)\s+(?:at|@|-|–|\|)\s+(.*?)$/i);
      if (atMatch) {
        roleTitle = atMatch[1].trim();
        companyName = atMatch[2].trim();
      } else if (lines.length >= 2) {
        roleTitle = lines[0];
        companyName = lines[1];
      } else {
        roleTitle = firstLine;
      }
    }

    // Clean up role and company
    roleTitle = roleTitle.slice(0, 100).replace(/[^\w\s-()&/,.]/g, '').trim() || 'Software Engineer';
    companyName = companyName.slice(0, 80).replace(/[^\w\s-()&/,.']/g, '').trim() || 'Hiring Company';

    // 5. Skills extraction
    const techDict = [
      'React', 'Next.js', 'Vue', 'Angular', 'TypeScript', 'JavaScript', 'Node.js', 'NestJS', 'Express',
      'Python', 'Django', 'FastAPI', 'Java', 'Spring Boot', 'Go', 'Golang', 'Rust', 'C#', '.NET',
      'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST API', 'Prisma', 'Docker',
      'Kubernetes', 'AWS', 'GCP', 'Azure', 'CI/CD', 'Git', 'TailwindCSS', 'Microservices', 'Kafka'
    ];
    const keySkills = techDict.filter(skill => {
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(rawText);
    }).slice(0, 8);

    return {
      company_name: companyName,
      role_title: roleTitle,
      work_mode: workMode,
      location: location || (workMode === 'REMOTE' ? 'Remote' : undefined),
      salary_min: salaryMin,
      salary_max: salaryMax,
      currency: currency,
      contact_name: undefined,
      contact_email: contactEmail,
      key_skills: keySkills.length > 0 ? keySkills : ['TypeScript', 'Full Stack Development'],
      job_summary: rawText.length > 500 ? rawText.slice(0, 500) + '...' : rawText,
      extracted_with: 'Smart Heuristic Pattern Extractor',
    };
  }
}
