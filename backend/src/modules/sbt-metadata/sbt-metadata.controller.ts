import { Controller, Get, Param } from '@nestjs/common';

import { SbtMetadataService } from './sbt-metadata.service';

@Controller('sbt-metadata')
export class SbtMetadataController {
  constructor(private readonly sbtMetadataService: SbtMetadataService) {}

  @Get('level-up-request/:requestId')
  buildForLevelUpRequest(@Param('requestId') requestId: string) {
    return this.sbtMetadataService.buildForLevelUpRequest(requestId);
  }
}
