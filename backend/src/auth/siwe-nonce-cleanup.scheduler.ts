import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuthService } from './auth.service';

@Injectable()
export class SiweNonceCleanupScheduler {
  private readonly logger = new Logger(SiweNonceCleanupScheduler.name);

  constructor(private readonly authService: AuthService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCleanup() {
    try {
      await this.authService.deleteExpiredNonces();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(`만료된 SIWE nonce 정리에 실패했습니다: ${message}`);
    }
  }
}
