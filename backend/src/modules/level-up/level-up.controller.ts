import { Controller, Get, Param } from '@nestjs/common';

import { LevelUpService } from './level-up.service.js';

@Controller('level-up')
export class LevelUpController {
  constructor(private readonly levelUpService: LevelUpService) {}

  @Get('status/:userId')
  getStatus(@Param('userId') userId: string) {
    return this.levelUpService.getStatus(userId);
  }

  @Get('requests/:requestId')
  getRequestDetail(@Param('requestId') requestId: string) {
    return this.levelUpService.getRequestDetail(requestId);
  }
}
