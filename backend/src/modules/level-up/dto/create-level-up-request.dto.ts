export class CreateLevelUpRequestDto {
  userId!: string;
  currentLevel!: number;
  targetLevel!: number;
  nonce!: number;
  requestedAt?: string;
}
