import { IsLatitude, IsLongitude, IsString, IsUUID } from 'class-validator';

export class ClockInDto {
  @IsUUID()
  storeId: string;

  @IsString()
  qrToken: string;

  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;
}

