import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SaveOfferDto } from './dto/save-offer.dto';

@Injectable()
export class OffersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.offers.findMany({
      where: { user_id: userId },
      include: {
        applications: {
          select: {
            id: true,
            company_name: true,
            role_title: true,
            status: true,
            applied_date: true,
            location: true,
          },
        },
      },
      orderBy: { base_salary: 'desc' },
    });
  }

  async findByApplicationId(userId: string, applicationId: string) {
    const application = await this.prisma.applications.findFirst({
      where: { id: applicationId, user_id: userId },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID '${applicationId}' not found`);
    }

    const offer = await this.prisma.offers.findFirst({
      where: { application_id: applicationId, user_id: userId },
      include: {
        applications: {
          select: {
            id: true,
            company_name: true,
            role_title: true,
            status: true,
          },
        },
      },
    });

    return offer || null;
  }

  async upsert(userId: string, applicationId: string, dto: SaveOfferDto) {
    const application = await this.prisma.applications.findFirst({
      where: { id: applicationId, user_id: userId },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID '${applicationId}' not found`);
    }

    const offerData = {
      base_salary: dto.base_salary,
      currency: dto.currency || 'USD',
      bonus: dto.bonus || 0,
      equity: dto.equity || 0,
      work_mode: dto.work_mode || 'REMOTE',
      benefits_summary: dto.benefits_summary || null,
      offer_deadline: dto.offer_deadline ? new Date(dto.offer_deadline) : null,
      updated_at: new Date(),
    };

    const offer = await this.prisma.offers.upsert({
      where: { application_id: applicationId },
      create: {
        application_id: applicationId,
        user_id: userId,
        ...offerData,
      },
      update: offerData,
      include: {
        applications: {
          select: {
            id: true,
            company_name: true,
            role_title: true,
            status: true,
          },
        },
      },
    });

    // Also update application updated_at
    await this.prisma.applications.update({
      where: { id: applicationId },
      data: { updated_at: new Date() },
    });

    return offer;
  }

  async remove(userId: string, applicationId: string) {
    const application = await this.prisma.applications.findFirst({
      where: { id: applicationId, user_id: userId },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID '${applicationId}' not found`);
    }

    const offer = await this.prisma.offers.findFirst({
      where: { application_id: applicationId, user_id: userId },
    });

    if (!offer) {
      throw new NotFoundException(`Offer package for application '${applicationId}' not found`);
    }

    await this.prisma.offers.delete({
      where: { id: offer.id },
    });

    return { message: 'Offer package removed successfully' };
  }
}
