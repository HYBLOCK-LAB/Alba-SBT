import { Module } from '@nestjs/common';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SiweNonceCleanupScheduler } from './siwe-nonce-cleanup.scheduler';

@Module({
  imports: [BlockchainModule],
  controllers: [AuthController],
  providers: [AuthService, SiweNonceCleanupScheduler],
  exports: [AuthService],
})
export class AuthModule {}
