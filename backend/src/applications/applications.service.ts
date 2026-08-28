import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { QueryApplicationDto } from './dto/query-application.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, query: QueryApplicationDto) {
    const where: Prisma.applicationsWhereInput = {
      user_id: userId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { company_name: { contains: query.search, mode: 'insensitive' } },
        { role_title: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.applications.findMany({
      where,
      orderBy: { updated_at: 'desc' },
      include: {
        resumes: {
          select: {
            id: true,
            version_label: true,
            original_filename: true,
          },
        },
        _count: {
          select: {
            interviews: true,
            notes: true,
          },
        },
      },
    });
  }

  async findOne(userId: string, id: string) {
    const application = await this.prisma.applications.findFirst({
      where: {
        id,
        user_id: userId,
      },
      include: {
        resumes: {
          select: {
            id: true,
            version_label: true,
            original_filename: true,
            s3_key: true,
            uploaded_at: true,
          },
        },
        interviews: {
          orderBy: { scheduled_at: 'asc' },
        },
        notes: {
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID '${id}' not found`);
    }

    return application;
  }

  async create(userId: string, dto: CreateApplicationDto) {
    if (dto.resume_id) {
      const resume = await this.prisma.resumes.findFirst({
        where: { id: dto.resume_id, user_id: userId },
      });
      if (!resume) {
        throw new BadRequestException('Selected resume does not exist or does not belong to you');
      }
    }

    return this.prisma.applications.create({
      data: {
        user_id: userId,
        company_name: dto.company_name,
        role_title: dto.role_title,
        status: dto.status || 'APPLIED',
        applied_date: new Date(dto.applied_date),
        job_posting_url: dto.job_posting_url || null,
        resume_id: dto.resume_id || null,
      },
      include: {
        resumes: {
          select: {
            id: true,
            version_label: true,
            original_filename: true,
          },
        },
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateApplicationDto) {
    await this.findOne(userId, id);

    if (dto.resume_id) {
      const resume = await this.prisma.resumes.findFirst({
        where: { id: dto.resume_id, user_id: userId },
      });
      if (!resume) {
        throw new BadRequestException('Selected resume does not exist or does not belong to you');
      }
    }

    const data: Prisma.applicationsUpdateInput = {
      updated_at: new Date(),
    };

    if (dto.company_name !== undefined) data.company_name = dto.company_name;
    if (dto.role_title !== undefined) data.role_title = dto.role_title;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.applied_date !== undefined) data.applied_date = new Date(dto.applied_date);
    if (dto.job_posting_url !== undefined) data.job_posting_url = dto.job_posting_url;
    if (dto.resume_id !== undefined) {
      if (dto.resume_id === null) {
        data.resumes = { disconnect: true };
      } else {
        data.resumes = { connect: { id: dto.resume_id } };
      }
    }

    return this.prisma.applications.update({
      where: { id },
      data,
      include: {
        resumes: {
          select: {
            id: true,
            version_label: true,
            original_filename: true,
          },
        },
        _count: {
          select: {
            interviews: true,
            notes: true,
          },
        },
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    await this.prisma.applications.delete({
      where: { id },
    });

    return { message: 'Application deleted successfully' };
  }
}
