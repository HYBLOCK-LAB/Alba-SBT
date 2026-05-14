import { IsOptional, IsUUID } from 'class-validator';

export class ListExtraWorkRequestsDto {
  @IsOptional()
  @IsUUID()
  storeId?: string;
}

