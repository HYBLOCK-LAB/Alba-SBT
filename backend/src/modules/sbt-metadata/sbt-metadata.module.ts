import { Module } from '@nestjs/common';

import { BadgesModule } from '../badges/badges.module';
import { SbtMetadataController } from './sbt-metadata.controller';
import { SbtMetadataService } from './sbt-metadata.service';

@Module({
  imports: [BadgesModule],
  controllers: [SbtMetadataController],
  providers: [SbtMetadataService],
  exports: [SbtMetadataService]
})
export class SbtMetadataModule {}
