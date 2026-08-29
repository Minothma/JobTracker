import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: Partial<Record<keyof UsersService, jest.Mock>>;
  let jwtService: Partial<Record<keyof JwtService, jest.Mock>>;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-token'),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_ACCESS_SECRET') return 'access-secret';
              if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
              return null;
            }),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException if user already exists', async () => {
      usersService.findByEmail!.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });

      await expect(
        authService.register({ email: 'test@example.com', password: 'Password123!' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create new user and return tokens', async () => {
      usersService.findByEmail!.mockResolvedValue(null);
      usersService.create!.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        created_at: new Date(),
      });

      const result = await authService.register({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken', 'mock-token');
      expect(result).toHaveProperty('refreshToken', 'mock-token');
      expect(usersService.create).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByEmail!.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'unknown@example.com', password: 'Password123!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const passwordHash = await bcrypt.hash('CorrectPassword123!', 10);
      usersService.findByEmail!.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password_hash: passwordHash,
      });

      await expect(
        authService.login({ email: 'test@example.com', password: 'WrongPassword!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens on valid credentials', async () => {
      const passwordHash = await bcrypt.hash('ValidPass123!', 10);
      usersService.findByEmail!.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password_hash: passwordHash,
        created_at: new Date(),
      });

      const result = await authService.login({
        email: 'test@example.com',
        password: 'ValidPass123!',
      });

      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@example.com');
      expect(result).toHaveProperty('accessToken');
    });
  });
});
