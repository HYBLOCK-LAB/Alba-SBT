import { IsDateString, IsMilitaryTime, IsUUID } from 'class-validator';

export class CreateExtraWorkRequestDto {
  @IsUUID()
  storeId: string;

  @IsDateString()
  requestedDate: string;

  @IsMilitaryTime()
  requestedStartTime: string;

  @IsMilitaryTime()
  requestedEndTime: string;
}

