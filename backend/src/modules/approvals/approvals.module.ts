import { Module } from '@nestjs/common';

import { SbtMetadataModule } from '../sbt-metadata/sbt-metadata.module';
import { SbtTokensModule } from '../sbt-tokens/sbt-tokens.module';
import { ApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';

@Module({
  imports: [SbtMetadataModule, SbtTokensModule],
  controllers: [ApprovalsController],
  providers: [ApprovalsService]
})
export class ApprovalsModule {}
