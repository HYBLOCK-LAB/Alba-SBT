import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { ok } from '../common/utils/api-response';
import { GenerateCurrentNextMonthDto } from './dto/generate-current-next-month.dto';
import { GenerateSchedulesDto } from './dto/generate-schedules.dto';
import { SchedulesService } from './schedules.service';

@UseGuards(JwtAuthGuard)
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post('generate')
  async generate(@Body() dto: GenerateSchedulesDto, @CurrentUser() user: { id: string }) {
    const result = await this.schedulesService.generateFromRecurringPattern(dto, user.id);
    return ok(result);
  }

  @Post('generate/current-next-month')
  async generateCurrentAndNextMonth(
    @Body() dto: GenerateCurrentNextMonthDto,
    @CurrentUser() user: { id: string },
  ) {
    const result = await this.schedulesService.generateCurrentAndNextMonthForAssignment(
      dto.staffAssignmentId,
      user.id,
    );
    return ok(result);
  }
}
