import { Module } from '@nestjs/common';

import { LevelCheckController } from './level-check.controller';
import { LevelUpController } from './level-up.controller';
import { LevelUpService } from './level-up.service';

@Module({
  controllers: [LevelUpController, LevelCheckController],
  providers: [LevelUpService],
  exports: [LevelUpService]
})
export class LevelUpModule {}
