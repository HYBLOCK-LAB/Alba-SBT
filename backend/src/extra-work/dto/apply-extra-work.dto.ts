import { IsUUID } from 'class-validator';

export class ApplyExtraWorkDto {
  @IsUUID()
  extraWorkRequestId: string;
}

