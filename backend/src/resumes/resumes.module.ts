import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ResumesService } from './resumes.service';
import { ResumesController } from './resumes.controller';

@Module({
  imports: [ConfigModule],
  controllers: [ResumesController],
  providers: [ResumesService],
  exports: [ResumesService],
})
export class ResumesModule {}
