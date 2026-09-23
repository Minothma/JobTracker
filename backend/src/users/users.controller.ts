import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current logged-in user profile' })
  @ApiResponse({ status: 200, description: 'Profile returned successfully' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.findById(userId);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Get overall account statistics (applications, resumes, interviews, offers)' })
  @ApiResponse({ status: 200, description: 'Stats returned successfully' })
  async getStats(@CurrentUser('id') userId: string) {
    return this.usersService.getAccountStats(userId);
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Change account password with verification' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Current password does not match' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(userId, dto);
  }

  @Get('me/export')
  @ApiOperation({ summary: 'Export complete user data payload in JSON format for offline backup' })
  @ApiResponse({ status: 200, description: 'Full backup JSON returned' })
  async exportData(@CurrentUser('id') userId: string) {
    return this.usersService.exportAllUserData(userId);
  }
}

