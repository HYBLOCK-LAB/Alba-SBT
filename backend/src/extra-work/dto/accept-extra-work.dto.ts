import { IsDbUuid } from '../../common/validation/db-uuid';

export class AcceptExtraWorkDto {
  @IsDbUuid()
  applicationId: string;
}
