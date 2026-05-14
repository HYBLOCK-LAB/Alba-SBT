import { IsUUID } from 'class-validator';

export class AcceptExtraWorkDto {
  @IsUUID()
  applicationId: string;
}

