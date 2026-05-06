import { Body, Controller, Post } from '@nestjs/common';

import { CompleteSbtMintDto } from './dto/complete-sbt-mint.dto.js';
import { SbtTokensService } from './sbt-tokens.service.js';

@Controller('sbt-tokens')
export class SbtTokensController {
  constructor(private readonly sbtTokensService: SbtTokensService) {}

  @Post('complete-mint')
  completeMint(@Body() body: CompleteSbtMintDto) {
    return this.sbtTokensService.completeMint(body);
  }
}
