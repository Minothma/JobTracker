import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.users.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        created_at: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async create(email: string, passwordHash: string) {
    return this.prisma.users.create({
      data: {
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
      },
      select: {
        id: true,
        email: true,
        created_at: true,
      },
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Current password does not match');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password cannot be the same as current password');
    }

    const saltRounds = 10;
    const newHash = await bcrypt.hash(dto.newPassword, saltRounds);

    await this.prisma.users.update({
      where: { id: userId },
      data: { password_hash: newHash },
    });

    return { message: 'Password updated successfully' };
  }

  async getAccountStats(userId: string) {
    const [applicationsCount, resumesCount, offersCount, interviewsCount] = await Promise.all([
      this.prisma.applications.count({ where: { user_id: userId } }),
      this.prisma.resumes.count({ where: { user_id: userId } }),
      this.prisma.offers.count({ where: { user_id: userId } }),
      this.prisma.interviews.count({
        where: {
          applications: {
            user_id: userId,
          },
        },
      }),
    ]);

    return {
      applications_count: applicationsCount,
      resumes_count: resumesCount,
      offers_count: offersCount,
      interviews_count: interviewsCount,
    };
  }

  async exportAllUserData(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        created_at: true,
        applications: {
          include: {
            interviews: true,
            notes: true,
            offers: true,
            resumes: {
              select: {
                id: true,
                version_label: true,
                original_filename: true,
                uploaded_at: true,
              },
            },
          },
        },
        resumes: {
          select: {
            id: true,
            version_label: true,
            original_filename: true,
            uploaded_at: true,
          },
        },
        offers: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      exported_at: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      summary: {
        total_applications: user.applications.length,
        total_resumes: user.resumes.length,
        total_offers: user.offers.length,
      },
      data: {
        applications: user.applications,
        resumes: user.resumes,
        offers: user.offers,
      },
    };
  }
}

