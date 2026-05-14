import { IsOptional, Matches } from 'class-validator';
import { IsDbUuid } from '../../common/validation/db-uuid';

export class AttendanceMonthQueryDto {
  @Matches(/^\d{4}-\d{2}$/)
  month: string;

  @IsOptional()
  @IsDbUuid()
  storeId?: string;
}
