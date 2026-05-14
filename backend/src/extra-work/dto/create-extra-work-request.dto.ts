import { IsDateString, IsMilitaryTime } from 'class-validator';
import { IsDbUuid } from '../../common/validation/db-uuid';

export class CreateExtraWorkRequestDto {
  @IsDbUuid()
  storeId: string;

  @IsDateString()
  requestedDate: string;

  @IsMilitaryTime()
  requestedStartTime: string;

  @IsMilitaryTime()
  requestedEndTime: string;
}
