import { Controller, Get, Param } from '@nestjs/common';

import { BadgesService } from './badges.service.js';

@Controller('badges')
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get()
  list() {
    return this.badgesService.list();
  }

  @Get(':level')
  getByLevel(@Param('level') level: string) {
    return this.badgesService.getByLevel(Number(level));
  }
}
