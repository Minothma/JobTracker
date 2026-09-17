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

    if (query.is_favorite !== undefined) {
      where.is_favorite = query.is_favorite;
    }

    if (query.work_mode) {
      where.work_mode = query.work_mode;
    }

    if (query.search) {
      where.OR = [
        { company_name: { contains: query.search, mode: 'insensitive' } },
        { role_title: { contains: query.search, mode: 'insensitive' } },
        { location: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.applications.findMany({
      where,
      orderBy: [
        { is_favorite: 'desc' },
        { updated_at: 'desc' },
      ],
      include: {
        resumes: {
          select: {
            id: true,
            version_label: true,
            original_filename: true,
          },
        },
        offers: true,
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
        offers: true,
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
        salary_min: dto.salary_min !== undefined ? dto.salary_min : null,
        salary_max: dto.salary_max !== undefined ? dto.salary_max : null,
        currency: dto.currency || 'USD',
        work_mode: dto.work_mode || 'REMOTE',
        location: dto.location || null,
        job_description: dto.job_description || null,
        is_favorite: dto.is_favorite || false,
        contact_name: dto.contact_name || null,
        contact_email: dto.contact_email || null,
        rejection_reason: dto.rejection_reason || null,
      },
      include: {
        resumes: {
          select: {
            id: true,
            version_label: true,
            original_filename: true,
          },
        },
        offers: true,
        _count: {
          select: {
            interviews: true,
            notes: true,
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
    if (dto.salary_min !== undefined) data.salary_min = dto.salary_min;
    if (dto.salary_max !== undefined) data.salary_max = dto.salary_max;
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.work_mode !== undefined) data.work_mode = dto.work_mode;
    if (dto.location !== undefined) data.location = dto.location;
    if (dto.job_description !== undefined) data.job_description = dto.job_description;
    if (dto.is_favorite !== undefined) data.is_favorite = dto.is_favorite;
    if (dto.contact_name !== undefined) data.contact_name = dto.contact_name;
    if (dto.contact_email !== undefined) data.contact_email = dto.contact_email;
    if (dto.rejection_reason !== undefined) data.rejection_reason = dto.rejection_reason;

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
        offers: true,
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

  async getAnalytics(userId: string) {
    const applications = await this.prisma.applications.findMany({
      where: { user_id: userId },
      include: {
        interviews: {
          orderBy: { scheduled_at: 'asc' },
        },
        offers: true,
      },
      orderBy: { applied_date: 'asc' },
    });

    const totalApplications = applications.length;
    const statusCounts: Record<string, number> = {
      APPLIED: 0,
      INTERVIEW: 0,
      OFFER: 0,
      REJECTED: 0,
      WITHDRAWN: 0,
    };

    applications.forEach((app) => {
      if (statusCounts[app.status] !== undefined) {
        statusCounts[app.status]++;
      }
    });

    const activeApplications = statusCounts.APPLIED + statusCounts.INTERVIEW;
    const applicationsWithInterviews = applications.filter(
      (app) => app.interviews.length > 0 || app.status === 'INTERVIEW' || app.status === 'OFFER',
    ).length;
    const totalOffers = statusCounts.OFFER;
    const totalInterviewsCount = applications.reduce(
      (acc, curr) => acc + curr.interviews.length,
      0,
    );

    const appliedToInterviewRate = totalApplications > 0
      ? Math.round((applicationsWithInterviews / totalApplications) * 100)
      : 0;

    const interviewToOfferRate = applicationsWithInterviews > 0
      ? Math.round((totalOffers / applicationsWithInterviews) * 100)
      : 0;

    const overallOfferRate = totalApplications > 0
      ? Math.round((totalOffers / totalApplications) * 100)
      : 0;

    let totalDaysToFirstInterview = 0;
    let interviewedAppsCount = 0;

    applications.forEach((app) => {
      if (app.interviews && app.interviews.length > 0) {
        const appliedTime = new Date(app.applied_date).getTime();
        const firstInterviewTime = new Date(app.interviews[0].scheduled_at).getTime();
        const diffDays = Math.max(0, Math.round((firstInterviewTime - appliedTime) / (1000 * 60 * 60 * 24)));
        totalDaysToFirstInterview += diffDays;
        interviewedAppsCount++;
      }
    });

    const avgDaysToInterview = interviewedAppsCount > 0
      ? Math.round(totalDaysToFirstInterview / interviewedAppsCount)
      : 0;

    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const staleApplications = applications
      .filter((app) => {
        const isApplied = app.status === 'APPLIED';
        const appliedDate = new Date(app.applied_date);
        const hasNoInterviews = app.interviews.length === 0;
        return isApplied && hasNoInterviews && appliedDate < fourteenDaysAgo;
      })
      .map((app) => ({
        id: app.id,
        company_name: app.company_name,
        role_title: app.role_title,
        applied_date: app.applied_date,
        days_waiting: Math.round((now.getTime() - new Date(app.applied_date).getTime()) / (1000 * 60 * 60 * 24)),
      }));

    const monthlyVelocityMap: { [key: string]: number } = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString('en-US', { month: 'short' });
      monthlyVelocityMap[key] = 0;
    }

    applications.forEach((app) => {
      const appDate = new Date(app.applied_date);
      const monthKey = appDate.toLocaleString('en-US', { month: 'short' });
      if (monthlyVelocityMap[monthKey] !== undefined) {
        monthlyVelocityMap[monthKey]++;
      }
    });

    const monthlyVelocity = Object.entries(monthlyVelocityMap).map(([month, count]) => ({
      month,
      count,
    }));

    return {
      overview: {
        totalApplications,
        activeApplications,
        totalInterviewsCount,
        applicationsWithInterviews,
        totalOffers,
        statusCounts,
        appliedToInterviewRate,
        interviewToOfferRate,
        overallOfferRate,
        avgDaysToInterview,
      },
      funnel: [
        { stage: 'Applied', count: totalApplications, percentage: 100 },
        { stage: 'Interview', count: applicationsWithInterviews, percentage: appliedToInterviewRate },
        { stage: 'Offer', count: totalOffers, percentage: overallOfferRate },
      ],
      monthlyVelocity,
      staleApplications,
    };
  }
}
