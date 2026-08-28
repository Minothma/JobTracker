import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class InterviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, applicationId: string, dto: CreateInterviewDto) {
    const application = await this.prisma.applications.findFirst({
      where: { id: applicationId, user_id: userId },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID '${applicationId}' not found`);
    }

    return this.prisma.interviews.create({
      data: {
        application_id: applicationId,
        round_type: dto.round_type.trim(),
        scheduled_at: new Date(dto.scheduled_at),
        outcome: dto.outcome || null,
        notes: dto.notes || null,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateInterviewDto) {
    const interview = await this.prisma.interviews.findFirst({
      where: {
        id,
        applications: { user_id: userId },
      },
    });

    if (!interview) {
      throw new NotFoundException(`Interview with ID '${id}' not found`);
    }

    const data: Prisma.interviewsUpdateInput = {};
    if (dto.round_type !== undefined) data.round_type = dto.round_type.trim();
    if (dto.scheduled_at !== undefined) data.scheduled_at = new Date(dto.scheduled_at);
    if (dto.outcome !== undefined) data.outcome = dto.outcome;
    if (dto.notes !== undefined) data.notes = dto.notes;

    return this.prisma.interviews.update({
      where: { id },
      data,
    });
  }

  async remove(userId: string, id: string) {
    const interview = await this.prisma.interviews.findFirst({
      where: {
        id,
        applications: { user_id: userId },
      },
    });

    if (!interview) {
      throw new NotFoundException(`Interview with ID '${id}' not found`);
    }

    await this.prisma.interviews.delete({
      where: { id },
    });

    return { message: 'Interview deleted successfully' };
  }
}
