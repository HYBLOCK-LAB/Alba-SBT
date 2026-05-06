import { Module } from '@nestjs/common';

import { BadgesModule } from '../badges/badges.module.js';
import { SbtMetadataController } from './sbt-metadata.controller.js';
import { SbtMetadataService } from './sbt-metadata.service.js';

@Module({
  imports: [BadgesModule],
  controllers: [SbtMetadataController],
  providers: [SbtMetadataService],
  exports: [SbtMetadataService]
})
export class SbtMetadataModule {}
