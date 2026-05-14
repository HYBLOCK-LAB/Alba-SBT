import { IsLatitude, IsLongitude, IsOptional, IsString, IsUUID } from 'class-validator';

export class ClockOutDto {
  @IsUUID()
  storeId: string;

  @IsOptional()
  @IsUUID()
  attendanceId?: string;

  @IsString()
  qrToken: string;

  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;
}
