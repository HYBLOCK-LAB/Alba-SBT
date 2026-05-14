import { IsString } from 'class-validator';
import { IsDbUuid } from '../../common/validation/db-uuid';

export class VerifyQrTokenDto {
  @IsDbUuid()
  storeId: string;

  @IsString()
  qrToken: string;
}
