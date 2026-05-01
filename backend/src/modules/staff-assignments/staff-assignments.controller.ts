import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { ApproveStaffAssignmentDto } from './dto/approve-staff-assignment.dto.js';
import { CreateStaffAssignmentDto } from './dto/create-staff-assignment.dto.js';
import { StaffAssignmentsService } from './staff-assignments.service.js';

@Controller('staff-assignments')
export class StaffAssignmentsController {
  constructor(private readonly staffAssignmentsService: StaffAssignmentsService) {}

  @Get('store/:storeId')
  listByStore(@Param('storeId') storeId: string) {
    return this.staffAssignmentsService.listByStore(storeId);
  }

  @Post()
  create(@Body() body: CreateStaffAssignmentDto) {
    return this.staffAssignmentsService.create(body);
  }

  @Patch(':assignmentId/approve')
  approve(
    @Param('assignmentId') assignmentId: string,
    @Body() body: ApproveStaffAssignmentDto
  ) {
    return this.staffAssignmentsService.approve(assignmentId, body);
  }
}
