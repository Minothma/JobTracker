import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let prisma: {
    applications: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    resumes: {
      findFirst: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      applications: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      resumes: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should query applications scoped to userId', async () => {
      const mockApps = [
        { id: 'app-1', user_id: 'user-1', company_name: 'Google', role_title: 'SWE Intern', status: 'APPLIED' },
      ];
      prisma.applications.findMany.mockResolvedValue(mockApps);

      const result = await service.findAll('user-1', {});

      expect(prisma.applications.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ user_id: 'user-1' }),
        }),
      );
      expect(result).toEqual(mockApps);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if application not found for user', async () => {
      prisma.applications.findFirst.mockResolvedValue(null);

      await expect(service.findOne('user-1', 'invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('should return application when found', async () => {
      const mockApp = { id: 'app-1', user_id: 'user-1', company_name: 'Stripe', role_title: 'Backend Intern' };
      prisma.applications.findFirst.mockResolvedValue(mockApp);

      const result = await service.findOne('user-1', 'app-1');
      expect(result).toEqual(mockApp);
    });
  });

  describe('create', () => {
    it('should create an application with userId', async () => {
      const createDto = {
        company_name: 'Meta',
        role_title: 'Fullstack Intern',
        applied_date: '2026-03-01',
      };
      const mockCreated = { id: 'app-2', user_id: 'user-1', ...createDto, status: 'APPLIED' };
      prisma.applications.create.mockResolvedValue(mockCreated);

      const result = await service.create('user-1', createDto);
      expect(prisma.applications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            user_id: 'user-1',
            company_name: 'Meta',
          }),
        }),
      );
      expect(result).toEqual(mockCreated);
    });
  });
});
