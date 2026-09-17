import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OffersService } from './offers.service';
import { SaveOfferDto } from './dto/save-offer.dto';

@ApiTags('Offers')
@ApiBearerAuth('JWT-auth')
@Controller()
@UseGuards(JwtAuthGuard)
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Get('offers')
  @ApiOperation({ summary: 'List all job offers for compensation matrix comparison' })
  @ApiResponse({ status: 200, description: 'All offers returned sorted by total base salary' })
  async findAll(@CurrentUser('id') userId: string) {
    return this.offersService.findAll(userId);
  }

  @Get('applications/:applicationId/offer')
  @ApiOperation({ summary: 'Get compensation package details for a specific application' })
  @ApiParam({ name: 'applicationId', description: 'Application UUID' })
  @ApiResponse({ status: 200, description: 'Offer package returned or null if not yet logged' })
  async findByApplicationId(
    @CurrentUser('id') userId: string,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    return this.offersService.findByApplicationId(userId, applicationId);
  }

  @Put('applications/:applicationId/offer')
  @ApiOperation({ summary: 'Create or update compensation package for an application' })
  @ApiParam({ name: 'applicationId', description: 'Application UUID' })
  @ApiResponse({ status: 200, description: 'Offer package saved successfully' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async upsert(
    @CurrentUser('id') userId: string,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() dto: SaveOfferDto,
  ) {
    return this.offersService.upsert(userId, applicationId, dto);
  }

  @Delete('applications/:applicationId/offer')
  @ApiOperation({ summary: 'Delete offer package for an application' })
  @ApiParam({ name: 'applicationId', description: 'Application UUID' })
  @ApiResponse({ status: 200, description: 'Offer package deleted successfully' })
  @ApiResponse({ status: 404, description: 'Offer not found' })
  async remove(
    @CurrentUser('id') userId: string,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    return this.offersService.remove(userId, applicationId);
  }
}
