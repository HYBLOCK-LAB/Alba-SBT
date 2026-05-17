import { Module } from '@nestjs/common';

import { SbtTokensController } from './sbt-tokens.controller';
import { SbtTokensService } from './sbt-tokens.service';

@Module({
  controllers: [SbtTokensController],
  providers: [SbtTokensService],
  exports: [SbtTokensService]
})
export class SbtTokensModule {}
