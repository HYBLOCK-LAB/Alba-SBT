import { Module } from '@nestjs/common';

import { LevelUpController } from './level-up.controller.js';
import { LevelUpService } from './level-up.service.js';

@Module({
  controllers: [LevelUpController],
  providers: [LevelUpService],
  exports: [LevelUpService]
})
export class LevelUpModule {}
