import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post('applications/:appId/notes')
  async create(
    @CurrentUser('id') userId: string,
    @Param('appId', ParseUUIDPipe) appId: string,
    @Body() createNoteDto: CreateNoteDto,
  ) {
    return this.notesService.create(userId, appId, createNoteDto);
  }

  @Delete('notes/:id')
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notesService.remove(userId, id);
  }
}
