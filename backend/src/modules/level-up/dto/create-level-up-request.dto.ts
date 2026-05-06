export class CreateLevelUpRequestDto {
  userId!: string;
  currentLevel!: number;
  targetLevel!: number;
  nonce!: string;
  requestedAt?: string;
}
