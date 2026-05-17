export interface AuthUser {
  id: string;
  walletAddress: string;
  accountType: 'worker' | 'manager';
}
