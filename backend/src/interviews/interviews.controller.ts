import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { InterviewsService } from './interviews.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Interviews')
@ApiBearerAuth('JWT-auth')
@Controller()
@UseGuards(JwtAuthGuard)
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Post('applications/:appId/interviews')
  @ApiOperation({ summary: 'Schedule a new interview round for an application' })
  @ApiParam({ name: 'appId', description: 'Application UUID' })
  @ApiResponse({ status: 201, description: 'Interview round scheduled successfully' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async create(
    @CurrentUser('id') userId: string,
    @Param('appId', ParseUUIDPipe) appId: string,
    @Body() createInterviewDto: CreateInterviewDto,
  ) {
    return this.interviewsService.create(userId, appId, createInterviewDto);
  }

  @Patch('interviews/:id')
  @ApiOperation({ summary: 'Update interview outcome, date/time, or prep notes' })
  @ApiParam({ name: 'id', description: 'Interview UUID' })
  @ApiResponse({ status: 200, description: 'Interview updated successfully' })
  @ApiResponse({ status: 404, description: 'Interview not found' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateInterviewDto: UpdateInterviewDto,
  ) {
    return this.interviewsService.update(userId, id, updateInterviewDto);
  }

  @Delete('interviews/:id')
  @ApiOperation({ summary: 'Delete an interview round' })
  @ApiParam({ name: 'id', description: 'Interview UUID' })
  @ApiResponse({ status: 200, description: 'Interview deleted successfully' })
  @ApiResponse({ status: 404, description: 'Interview not found' })
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.interviewsService.remove(userId, id);
  }
}
