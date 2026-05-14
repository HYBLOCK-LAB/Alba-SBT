import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class GenerateSchedulesDto {
  @IsUUID()
  staffAssignmentId: string;

  @IsDateString()
  fromDate: string;

  @IsDateString()
  toDate: string;

  @IsOptional()
  @IsUUID()
  recurringScheduleId?: string;
}

