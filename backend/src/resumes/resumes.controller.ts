import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ResumesService } from './resumes.service';
import { GetUploadUrlDto } from './dto/get-upload-url.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Resumes')
@ApiBearerAuth('JWT-auth')
@Controller('resumes')
@UseGuards(JwtAuthGuard)
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  @Get()
  @ApiOperation({ summary: 'List all uploaded resume versions with signed download URLs' })
  @ApiResponse({ status: 200, description: 'List of resumes returned successfully' })
  async findAll(@CurrentUser('id') userId: string) {
    return this.resumesService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get resume details and active signed download link' })
  @ApiParam({ name: 'id', description: 'Resume UUID' })
  @ApiResponse({ status: 200, description: 'Resume found and returned' })
  @ApiResponse({ status: 404, description: 'Resume not found' })
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.resumesService.findOne(userId, id);
  }

  @Post('upload-url')
  @ApiOperation({ summary: 'Generate AWS S3 presigned PUT URL for direct browser-to-S3 upload' })
  @ApiResponse({ status: 201, description: 'Presigned upload URL generated successfully' })
  async getUploadUrl(
    @CurrentUser('id') userId: string,
    @Body() getUploadUrlDto: GetUploadUrlDto,
  ) {
    return this.resumesService.getPresignedUploadUrl(userId, getUploadUrlDto);
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm S3 direct upload completed successfully' })
  @ApiParam({ name: 'id', description: 'Resume UUID' })
  @ApiResponse({ status: 200, description: 'Resume upload confirmed and active' })
  async confirmUpload(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.resumesService.confirmUpload(userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a resume version and remove object from S3' })
  @ApiParam({ name: 'id', description: 'Resume UUID' })
  @ApiResponse({ status: 200, description: 'Resume deleted successfully' })
  @ApiResponse({ status: 404, description: 'Resume not found' })
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.resumesService.remove(userId, id);
  }
}
