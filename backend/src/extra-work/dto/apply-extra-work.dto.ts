import { IsDbUuid } from '../../common/validation/db-uuid';

export class ApplyExtraWorkDto {
  @IsDbUuid()
  extraWorkRequestId: string;
}
