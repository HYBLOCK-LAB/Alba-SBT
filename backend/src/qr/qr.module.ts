import { Module } from '@nestjs/common';
import { QrController } from './qr.controller';
import { QrCleanupScheduler } from './qr-cleanup.scheduler';
import { QrService } from './qr.service';

@Module({
  controllers: [QrController],
  providers: [QrService, QrCleanupScheduler],
  exports: [QrService],
})
export class QrModule {}

