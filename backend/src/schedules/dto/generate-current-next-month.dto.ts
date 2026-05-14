import { IsDbUuid } from '../../common/validation/db-uuid';

export class GenerateCurrentNextMonthDto {
  @IsDbUuid()
  staffAssignmentId: string;
}
