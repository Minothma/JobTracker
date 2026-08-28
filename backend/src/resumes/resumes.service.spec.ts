import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { ResumesService } from './resumes.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ResumesService', () => {
  let service: ResumesService;
  let prisma: {
    resumes: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      resumes: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResumesService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'AWS_REGION') return 'us-east-1';
              if (key === 'S3_BUCKET_NAME') return 'test-resumes-bucket';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ResumesService>(ResumesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPresignedUploadUrl', () => {
    it('should create resume record and return upload metadata', async () => {
      prisma.resumes.create.mockResolvedValue({
        id: 'resume-1',
        user_id: 'user-1',
        version_label: 'Backend v1',
        original_filename: 'cv.pdf',
        s3_key: 'resumes/user-1/123-cv.pdf',
      });

      const result = await service.getPresignedUploadUrl('user-1', {
        filename: 'cv.pdf',
        version_label: 'Backend v1',
      });

      expect(result).toHaveProperty('resume_id', 'resume-1');
      expect(result).toHaveProperty('upload_url');
      expect(result).toHaveProperty('s3_key');
      expect(prisma.resumes.create).toHaveBeenCalled();
    });
  });

  describe('confirmUpload', () => {
    it('should throw NotFoundException if resume does not exist for user', async () => {
      prisma.resumes.findFirst.mockResolvedValue(null);

      await expect(service.confirmUpload('user-1', 'invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('should update resume timestamp when confirmed', async () => {
      prisma.resumes.findFirst.mockResolvedValue({ id: 'resume-1', user_id: 'user-1' });
      prisma.resumes.update.mockResolvedValue({ id: 'resume-1', user_id: 'user-1', uploaded_at: new Date() });

      const result = await service.confirmUpload('user-1', 'resume-1');
      expect(result.id).toBe('resume-1');
      expect(prisma.resumes.update).toHaveBeenCalled();
    });
  });
});
