import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AppLogger } from '../common/logging/app-logger.service';
import { AttendanceService } from './attendance.service';

@Injectable()
export class AttendanceJudgementScheduler {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly logger: AppLogger,
  ) {}

  @Cron('0 0 0 * * *', { timeZone: 'Asia/Seoul' })
  async handleDailyAttendanceJudgement() {
    await this.attendanceService.markAbsencesForYesterday();
    this.logger.log('Daily attendance judgement completed', AttendanceJudgementScheduler.name);
  }
}
