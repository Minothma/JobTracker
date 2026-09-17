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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OffersService } from './offers.service';
import { SaveOfferDto } from './dto/save-offer.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Get('offers')
  async findAll(@CurrentUser('sub') userId: string) {
    return this.offersService.findAll(userId);
  }

  @Get('applications/:applicationId/offer')
  async findByApplicationId(
    @CurrentUser('sub') userId: string,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    return this.offersService.findByApplicationId(userId, applicationId);
  }

  @Put('applications/:applicationId/offer')
  async upsert(
    @CurrentUser('sub') userId: string,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() dto: SaveOfferDto,
  ) {
    return this.offersService.upsert(userId, applicationId, dto);
  }

  @Delete('applications/:applicationId/offer')
  async remove(
    @CurrentUser('sub') userId: string,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    return this.offersService.remove(userId, applicationId);
  }
}
