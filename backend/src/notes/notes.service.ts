import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, applicationId: string, dto: CreateNoteDto) {
    const application = await this.prisma.applications.findFirst({
      where: { id: applicationId, user_id: userId },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID '${applicationId}' not found`);
    }

    return this.prisma.notes.create({
      data: {
        application_id: applicationId,
        content: dto.content.trim(),
      },
    });
  }

  async remove(userId: string, id: string) {
    const note = await this.prisma.notes.findFirst({
      where: {
        id,
        applications: { user_id: userId },
      },
    });

    if (!note) {
      throw new NotFoundException(`Note with ID '${id}' not found`);
    }

    await this.prisma.notes.delete({
      where: { id },
    });

    return { message: 'Note deleted successfully' };
  }
}
