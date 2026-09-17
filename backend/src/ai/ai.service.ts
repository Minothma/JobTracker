import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MatchResumeDto } from './dto/match-resume.dto';
import { GenerateEmailDto, EmailType, EmailTone } from './dto/generate-email.dto';
import { InterviewPrepDto, InterviewRoundType } from './dto/interview-prep.dto';
import { ScrapeJobUrlDto } from './dto/scrape-job-url.dto';

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
        resumeContent = `Resume Version: ${resume.version_label} (${resume.original_filename})`;
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
}
