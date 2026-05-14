import { IsDateString, IsOptional } from 'class-validator';
import { IsDbUuid } from '../../common/validation/db-uuid';

export class GenerateSchedulesDto {
  @IsDbUuid()
  staffAssignmentId: string;

  @IsDateString()
  fromDate: string;

  @IsDateString()
  toDate: string;

  @IsOptional()
  @IsDbUuid()
  recurringScheduleId?: string;
}
