export type AccountType = 'worker' | 'manager';

export type AuthenticatedUser = {
  sub: string;
  walletAddress: string;
  accountType: AccountType;
  iat?: number;
  exp?: number;
};

export type AuthenticatedRequest = {
  headers: Record<string, string | string[] | undefined>;
  user?: AuthenticatedUser;
};
