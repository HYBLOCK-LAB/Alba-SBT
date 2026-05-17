import { api } from './api';
import type { User } from '../types';

export interface LoginResponse {
  token: string;
  user: User;
}

export function siweLogin(walletAddress: string, message: string, signature: string) {
  return api.post<LoginResponse>('/auth/siwe-login', { walletAddress, message, signature });
}

export function getUserByWallet(walletAddress: string) {
  return api.get<User>(`/users/${walletAddress}`);
}

export function createUser(body: {
  wallet_address: string;
  account_type: 'worker' | 'manager';
  name: string;
  phone?: string;
}) {
  return api.post<User>('/users', body);
}
