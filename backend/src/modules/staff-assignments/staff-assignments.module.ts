import { Module } from '@nestjs/common';

import { StaffAssignmentsController } from './staff-assignments.controller.js';
import { StaffAssignmentsService } from './staff-assignments.service.js';

@Module({
  controllers: [StaffAssignmentsController],
  providers: [StaffAssignmentsService],
  exports: [StaffAssignmentsService]
})
export class StaffAssignmentsModule {}
