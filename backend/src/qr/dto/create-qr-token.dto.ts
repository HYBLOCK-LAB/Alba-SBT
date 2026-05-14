import { IsUUID } from 'class-validator';

export class CreateQrTokenDto {
  @IsUUID()
  storeId: string;
}

