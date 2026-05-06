import { Body, Controller, Post } from '@nestjs/common';

import { CheckLevelUpDto } from './dto/check-level-up.dto.js';
import { LevelUpService } from './level-up.service.js';

@Controller('level-check')
export class LevelCheckController {
  constructor(private readonly levelUpService: LevelUpService) {}

  @Post()
  check(@Body() body: CheckLevelUpDto) {
    return this.levelUpService.checkLevelUp(body);
  }
}
