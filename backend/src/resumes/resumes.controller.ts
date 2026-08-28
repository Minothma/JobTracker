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
import { ResumesService } from './resumes.service';
import { GetUploadUrlDto } from './dto/get-upload-url.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('resumes')
@UseGuards(JwtAuthGuard)
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    return this.resumesService.findAll(userId);
  }

  @Get(':id')
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.resumesService.findOne(userId, id);
  }

  @Post('upload-url')
  async getUploadUrl(
    @CurrentUser('id') userId: string,
    @Body() getUploadUrlDto: GetUploadUrlDto,
  ) {
    return this.resumesService.getPresignedUploadUrl(userId, getUploadUrlDto);
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmUpload(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.resumesService.confirmUpload(userId, id);
  }

  @Delete(':id')
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.resumesService.remove(userId, id);
  }
}
