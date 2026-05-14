import { IsString, IsUUID } from 'class-validator';

export class VerifyQrTokenDto {
  @IsUUID()
  storeId: string;

  @IsString()
  qrToken: string;
}

