import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AppLogger } from '../common/logging/app-logger.service';
import { SchedulesService } from './schedules.service';

@Injectable()
export class MonthlyScheduleScheduler {
  constructor(
    private readonly schedulesService: SchedulesService,
    private readonly logger: AppLogger,
  ) {}

  @Cron('0 0 0 25 * *', { timeZone: 'Asia/Seoul' })
  async handleMonthlyScheduleGeneration() {
    const result = await this.schedulesService.generateNextMonthForAllActivePatterns();
    this.logger.log(
      `Monthly schedule generation completed: ${result.inserted} inserted`,
      MonthlyScheduleScheduler.name,
    );
  }
}

