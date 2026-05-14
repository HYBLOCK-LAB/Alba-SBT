import { IsDbUuid } from '../../common/validation/db-uuid';

export class CreateQrTokenDto {
  @IsDbUuid()
  storeId: string;
}
