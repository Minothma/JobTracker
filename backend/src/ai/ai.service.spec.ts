import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { InterviewRoundType } from './dto/interview-prep.dto';
import { EmailType, EmailTone } from './dto/generate-email.dto';

describe('AiService', () => {
  let service: AiService;
  let prisma: any;

  beforeEach(async () => {
    const mockPrisma = {
      resumes: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      applications: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      users: {
        findUnique: jest.fn().mockResolvedValue({ email: 'alex@example.com' }),
      },
    };

    const mockConfig = {
      get: jest.fn().mockReturnValue(undefined), // Test fallback mode by default
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('matchResume', () => {
    it('should compute ATS match score and recommendations via semantic parser', async () => {
      const result = await service.matchResume('user-1', {
        job_description: 'We need a Senior Engineer skilled in TypeScript, React, PostgreSQL, and AWS.',
        resume_text: 'Experienced software developer with TypeScript, React, and PostgreSQL background.',
        role_title: 'Senior Engineer',
        company_name: 'Stripe',
      });

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(50);
      expect(result.matched_skills).toContain('TypeScript');
      expect(result.matched_skills).toContain('React');
      expect(result.missing_skills).toContain('AWS');
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('generateEmail', () => {
    it('should generate a follow-up email template when offline', async () => {
      const result = await service.generateEmail('user-1', {
        type: EmailType.FOLLOW_UP,
        tone: EmailTone.PROFESSIONAL,
        company_name: 'Vercel',
        role_title: 'Full Stack Engineer',
        recipient_name: 'Sarah',
      });

      expect(result).toBeDefined();
      expect(result.subject).toContain('Following Up');
      expect(result.body).toContain('Sarah');
      expect(result.body).toContain('Vercel');
    });
  });

  describe('generateInterviewPrep', () => {
    it('should generate 5 tailored technical & behavioral interview questions with answer frameworks', async () => {
      const result = await service.generateInterviewPrep('user-1', {
        role_title: 'Backend Engineer',
        company_name: 'Netflix',
        job_description: 'Seeking engineer with NestJS, PostgreSQL, microservices, and AWS experience.',
        round_type: InterviewRoundType.MIXED,
      });

      expect(result).toBeDefined();
      expect(result.role_title).toBe('Backend Engineer');
      expect(result.company_name).toBe('Netflix');
      expect(result.questions.length).toBe(5);
      expect(result.questions[0].sample_answer_framework).toBeDefined();
      expect(result.general_interview_tips.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('scrapeJobPostingUrl', () => {
    it('should reject invalid URL format', async () => {
      await expect(service.scrapeJobPostingUrl({ url: 'not-a-valid-url' })).rejects.toThrow();
    });
  });
});
