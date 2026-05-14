import { IsUUID } from 'class-validator';

export class GenerateCurrentNextMonthDto {
  @IsUUID()
  staffAssignmentId: string;
}

