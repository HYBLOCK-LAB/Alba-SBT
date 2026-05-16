import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { SbtMetadataModule } from '../sbt-metadata/sbt-metadata.module.js';
import { SbtTokensModule } from '../sbt-tokens/sbt-tokens.module.js';
import { ApprovalsController } from './approvals.controller.js';
import { ApprovalsService } from './approvals.service.js';

@Module({
  imports: [AuthModule, SbtMetadataModule, SbtTokensModule],
  controllers: [ApprovalsController],
  providers: [ApprovalsService]
})
export class ApprovalsModule {}
