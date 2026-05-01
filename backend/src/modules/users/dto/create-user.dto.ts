export class CreateUserDto {
  accountType!: 'worker' | 'manager';
  name!: string;
  email?: string;
  phone?: string;
  walletAddress!: string;
}
