import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { ApproveStaffAssignmentDto } from './dto/approve-staff-assignment.dto';
import { CreateStaffAssignmentDto } from './dto/create-staff-assignment.dto';
import { StaffAssignmentsService } from './staff-assignments.service';

@Controller('staff-assignments')
export class StaffAssignmentsController {
  constructor(private readonly staffAssignmentsService: StaffAssignmentsService) {}

  @Get('store/:storeId')
  listByStore(@Param('storeId') storeId: string) {
    return this.staffAssignmentsService.listByStore(storeId);
  }

  @Get('user/:userId')
  listByUser(@Param('userId') userId: string) {
    return this.staffAssignmentsService.listByUser(userId);
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
