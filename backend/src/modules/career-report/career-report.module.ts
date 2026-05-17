import { Module } from '@nestjs/common';

import { CareerReportController } from './career-report.controller';
import { CareerReportService } from './career-report.service';

@Module({
  controllers: [CareerReportController],
  providers: [CareerReportService],
})
export class CareerReportModule {}
