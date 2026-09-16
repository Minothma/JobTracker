import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('alerts')
  async getAlerts(@CurrentUser('id') userId: string) {
    const alerts = await this.notificationsService.getStaleAlerts(userId);
    return {
      count: alerts.length,
      alerts,
    };
  }

  @Post('trigger')
  async triggerManualCheck(@CurrentUser('id') userId: string) {
    return this.notificationsService.triggerManualCheck(userId);
  }
}
