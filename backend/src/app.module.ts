import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AttendanceModule } from './attendance/attendance.module';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { ExtraWorkModule } from './extra-work/extra-work.module';
import { QrModule } from './qr/qr.module';
import { SchedulesModule } from './schedules/schedules.module';
import { StoresModule } from './modules/stores/stores.module';
import { StaffAssignmentsModule } from './modules/staff-assignments/staff-assignments.module';
import { LevelUpModule } from './modules/level-up/level-up.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { BadgesModule } from './modules/badges/badges.module';
import { SbtTokensModule } from './modules/sbt-tokens/sbt-tokens.module';
import { SbtMetadataModule } from './modules/sbt-metadata/sbt-metadata.module';
import { UsersModule } from './modules/users/users.module';
import { CareerReportModule } from './modules/career-report/career-report.module';

@Module({
  imports: [
    CommonModule,
    ScheduleModule.forRoot(),
    AuthModule,
    QrModule,
    AttendanceModule,
    SchedulesModule,
    ExtraWorkModule,
    StoresModule,
    StaffAssignmentsModule,
    LevelUpModule,
    ApprovalsModule,
    BadgesModule,
    SbtTokensModule,
    SbtMetadataModule,
    UsersModule,
    CareerReportModule,
  ],
})
export class AppModule {}
