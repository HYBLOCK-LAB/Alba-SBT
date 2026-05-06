import { Module } from '@nestjs/common';

import { SbtTokensController } from './sbt-tokens.controller.js';
import { SbtTokensService } from './sbt-tokens.service.js';

@Module({
  controllers: [SbtTokensController],
  providers: [SbtTokensService],
  exports: [SbtTokensService]
})
export class SbtTokensModule {}
