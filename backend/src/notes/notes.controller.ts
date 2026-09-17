import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Notes')
@ApiBearerAuth('JWT-auth')
@Controller()
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post('applications/:appId/notes')
  @ApiOperation({ summary: 'Add a new note / timeline entry to an application' })
  @ApiParam({ name: 'appId', description: 'Application UUID' })
  @ApiResponse({ status: 201, description: 'Note created successfully' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async create(
    @CurrentUser('id') userId: string,
    @Param('appId', ParseUUIDPipe) appId: string,
    @Body() createNoteDto: CreateNoteDto,
  ) {
    return this.notesService.create(userId, appId, createNoteDto);
  }

  @Delete('notes/:id')
  @ApiOperation({ summary: 'Delete an application note' })
  @ApiParam({ name: 'id', description: 'Note UUID' })
  @ApiResponse({ status: 200, description: 'Note deleted successfully' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notesService.remove(userId, id);
  }
}
