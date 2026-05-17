import { IsLatitude, IsLongitude, IsOptional, IsString } from 'class-validator';
import { IsDbUuid } from '../../common/validation/db-uuid';

export class ClockOutDto {
  @IsDbUuid()
  storeId: string;

  @IsOptional()
  @IsDbUuid()
  attendanceId?: string;

  @IsString()
  qrToken: string;

  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;
}
