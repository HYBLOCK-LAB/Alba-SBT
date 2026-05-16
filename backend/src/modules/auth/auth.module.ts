import { Module } from '@nestjs/common';

import { JwtAuthGuard } from './jwt-auth.guard.js';
import { JwtService } from './jwt.service.js';

@Module({
  providers: [JwtService, JwtAuthGuard],
  exports: [JwtService, JwtAuthGuard]
})
export class AuthModule {}
