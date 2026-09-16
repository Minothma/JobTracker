import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { MatchResumeDto } from './dto/match-resume.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('match-resume')
  async matchResume(
    @CurrentUser('id') userId: string,
    @Body() matchResumeDto: MatchResumeDto,
  ) {
    return this.aiService.matchResume(userId, matchResumeDto);
  }
}
