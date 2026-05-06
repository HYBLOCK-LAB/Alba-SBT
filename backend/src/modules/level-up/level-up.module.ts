import { Module } from '@nestjs/common';

import { LevelCheckController } from './level-check.controller.js';
import { LevelUpController } from './level-up.controller.js';
import { LevelUpService } from './level-up.service.js';

@Module({
  controllers: [LevelUpController, LevelCheckController],
  providers: [LevelUpService],
  exports: [LevelUpService]
})
export class LevelUpModule {}
