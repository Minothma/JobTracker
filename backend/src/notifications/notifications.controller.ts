import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('alerts')
  @ApiOperation({ summary: 'Get stale applications awaiting recruiter follow-up (>14 days without interview)' })
  @ApiResponse({ status: 200, description: 'Alert count and stale applications list returned' })
  async getAlerts(@CurrentUser('id') userId: string) {
    const alerts = await this.notificationsService.getStaleAlerts(userId);
    return {
      count: alerts.length,
      alerts,
    };
  }

  @Post('trigger')
  @ApiOperation({ summary: 'Manually trigger a follow-up scan and email dispatch (AWS SES simulation)' })
  @ApiResponse({ status: 200, description: 'Scan triggered and reminder emails dispatched' })
  async triggerManualCheck(@CurrentUser('id') userId: string) {
    return this.notificationsService.triggerManualCheck(userId);
  }
}
