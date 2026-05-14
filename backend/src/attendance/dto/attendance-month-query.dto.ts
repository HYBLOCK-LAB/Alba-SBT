import { IsOptional, IsUUID, Matches } from 'class-validator';

export class AttendanceMonthQueryDto {
  @Matches(/^\d{4}-\d{2}$/)
  month: string;

  @IsOptional()
  @IsUUID()
  storeId?: string;
}

