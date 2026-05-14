import { IsLatitude, IsLongitude, IsString } from 'class-validator';
import { IsDbUuid } from '../../common/validation/db-uuid';

export class ClockInDto {
  @IsDbUuid()
  storeId: string;

  @IsString()
  qrToken: string;

  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;
}
