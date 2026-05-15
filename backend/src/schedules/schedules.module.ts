import { Module } from '@nestjs/common';
import { MonthlyScheduleScheduler } from './monthly-schedule.scheduler';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';

@Module({
  controllers: [SchedulesController],
  providers: [SchedulesService, MonthlyScheduleScheduler],
  exports: [SchedulesService],
})
export class SchedulesModule {}

