import { IsOptional } from 'class-validator';
import { IsDbUuid } from '../../common/validation/db-uuid';

export class ListExtraWorkRequestsDto {
  @IsOptional()
  @IsDbUuid()
  storeId?: string;
}
