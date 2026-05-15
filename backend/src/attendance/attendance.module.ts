import { Module } from '@nestjs/common';
import { QrModule } from '../qr/qr.module';
import { AttendanceController } from './attendance.controller';
import { AttendanceJudgementScheduler } from './attendance-judgement.scheduler';
import { AttendanceService } from './attendance.service';

@Module({
  imports: [QrModule],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceJudgementScheduler],
  exports: [AttendanceService],
})
export class AttendanceModule {}

