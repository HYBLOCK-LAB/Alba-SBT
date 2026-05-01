import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { CreateStoreDto } from './dto/create-store.dto.js';
import { StoresService } from './stores.service.js';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get('manager/:managerId')
  listByManager(@Param('managerId') managerId: string) {
    return this.storesService.listByManager(managerId);
  }

  @Get('code/:storeCode')
  getByStoreCode(@Param('storeCode') storeCode: string) {
    return this.storesService.getByStoreCode(storeCode);
  }

  @Post()
  create(@Body() body: CreateStoreDto) {
    return this.storesService.create(body);
  }
}
