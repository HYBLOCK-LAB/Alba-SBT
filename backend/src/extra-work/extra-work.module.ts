import { Module } from '@nestjs/common';
import { ExtraWorkController } from './extra-work.controller';
import { ExtraWorkService } from './extra-work.service';

@Module({
  controllers: [ExtraWorkController],
  providers: [ExtraWorkService],
})
export class ExtraWorkModule {}

