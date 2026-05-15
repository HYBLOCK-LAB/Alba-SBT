import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AttendanceModule } from './attendance/attendance.module';
import { CommonModule } from './common/common.module';
import { ExtraWorkModule } from './extra-work/extra-work.module';
import { QrModule } from './qr/qr.module';
import { SchedulesModule } from './schedules/schedules.module';

@Module({
  imports: [
    CommonModule,
    ScheduleModule.forRoot(),
    QrModule,
    AttendanceModule,
    SchedulesModule,
    ExtraWorkModule,
  ],
})
export class AppModule {}
