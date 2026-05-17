import { Controller, Get, Param } from '@nestjs/common';

import { CareerReportService } from './career-report.service';

@Controller('career-report')
export class CareerReportController {
  constructor(private readonly careerReportService: CareerReportService) {}

  @Get(':userId')
  getReport(@Param('userId') userId: string) {
    return this.careerReportService.getReport(userId);
  }
}
