import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { ok } from '../common/utils/api-response';
import { AttendanceService } from './attendance.service';
import { AttendanceMonthQueryDto } from './dto/attendance-month-query.dto';
import { ClockInDto } from './dto/clock-in.dto';
import { ClockOutDto } from './dto/clock-out.dto';

@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock-in')
  async clockIn(@Body() dto: ClockInDto, @CurrentUser() user: { id: string }) {
    const attendance = await this.attendanceService.clockIn(user.id, dto);
    return ok(attendance);
  }

  @Post('clock-out')
  async clockOut(@Body() dto: ClockOutDto, @CurrentUser() user: { id: string }) {
    const attendance = await this.attendanceService.clockOut(user.id, dto);
    return ok(attendance);
  }

  @Get('me/month')
  async getMyMonthlyAttendance(
    @Query() query: AttendanceMonthQueryDto,
    @CurrentUser() user: { id: string },
  ) {
    const attendance = await this.attendanceService.getMyMonthlyAttendance(user.id, query);
    return ok(attendance);
  }

  @Get('stores/:storeId/today')
  async getStoreTodayStatus(
    @Param('storeId') storeId: string,
    @CurrentUser() user: { id: string },
  ) {
    const status = await this.attendanceService.getStoreTodayStatus(user.id, storeId);
    return ok(status);
  }
}
