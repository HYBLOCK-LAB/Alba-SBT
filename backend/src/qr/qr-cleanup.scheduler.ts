import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppLogger } from '../common/logging/app-logger.service';
import { QrService } from './qr.service';

@Injectable()
export class QrCleanupScheduler {
  constructor(
    private readonly qrService: QrService,
    private readonly logger: AppLogger,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredQrCleanup() {
    await this.qrService.deleteExpiredTokens();
    this.logger.log('Expired QR tokens deleted', QrCleanupScheduler.name);
  }
}

