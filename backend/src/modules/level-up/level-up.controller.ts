import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { CreateLevelUpRequestDto } from './dto/create-level-up-request.dto.js';
import { LevelUpService } from './level-up.service.js';

@Controller('level-up')
export class LevelUpController {
  constructor(private readonly levelUpService: LevelUpService) {}

  @Get('status/:userId')
  getStatus(@Param('userId') userId: string) {
    return this.levelUpService.getStatus(userId);
  }

  @Post('requests')
  createRequest(@Body() body: CreateLevelUpRequestDto) {
    return this.levelUpService.createRequest(body);
  }
}
