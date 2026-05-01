import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { CreateUserDto } from './dto/create-user.dto.js';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':walletAddress')
  getByWalletAddress(@Param('walletAddress') walletAddress: string) {
    return this.usersService.getByWalletAddress(walletAddress);
  }

  @Post()
  create(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
  }
}
