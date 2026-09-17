import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { QueryApplicationDto } from './dto/query-application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Applications')
@ApiBearerAuth('JWT-auth')
@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  @ApiOperation({ summary: 'List all job applications with status/search filtering' })
  @ApiResponse({ status: 200, description: 'List of applications returned successfully' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() query: QueryApplicationDto,
  ) {
    return this.applicationsService.findAll(userId, query);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get application conversion funnel & velocity metrics' })
  @ApiResponse({ status: 200, description: 'Analytics statistics returned successfully' })
  async getAnalytics(@CurrentUser('id') userId: string) {
    return this.applicationsService.getAnalytics(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get application details including interviews, notes, and attached resume' })
  @ApiParam({ name: 'id', description: 'Application UUID' })
  @ApiResponse({ status: 200, description: 'Application found and returned' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.applicationsService.findOne(userId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new job application' })
  @ApiResponse({ status: 201, description: 'Application created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed or invalid resume reference' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() createApplicationDto: CreateApplicationDto,
  ) {
    return this.applicationsService.create(userId, createApplicationDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing application or transition status' })
  @ApiParam({ name: 'id', description: 'Application UUID' })
  @ApiResponse({ status: 200, description: 'Application updated successfully' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateApplicationDto: UpdateApplicationDto,
  ) {
    return this.applicationsService.update(userId, id, updateApplicationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an application and cascade child records' })
  @ApiParam({ name: 'id', description: 'Application UUID' })
  @ApiResponse({ status: 200, description: 'Application deleted successfully' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.applicationsService.remove(userId, id);
  }
}
