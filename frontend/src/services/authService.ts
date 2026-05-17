import { api } from './api';
import type { User } from '../types';

export interface SiweNonceResponse {
  nonce: string;
  expiresAt: string;
}

export interface SiweVerifyResponse {
  token: string | null;
  signupToken: string | null;
  walletAddress: string;
  isNewUser: boolean;
  accountType: 'worker' | 'manager' | null;
}

export interface SignupResponse {
  token: string;
  walletAddress: string;
  isNewUser: boolean;
  accountType: 'worker' | 'manager';
  initialMint: { status: string; txHash?: string };
}

export interface MeResponse {
  id: string;
  walletAddress: string;
  accountType: 'worker' | 'manager';
}

export function requestSiweNonce(walletAddress: string) {
  return api.post<SiweNonceResponse>('/auth/siwe/nonce', { walletAddress });
}

export function verifySiwe(walletAddress: string, message: string, signature: string) {
  return api.post<SiweVerifyResponse>('/auth/siwe/verify', { walletAddress, message, signature });
}

export function completeSignup(body: {
  signupToken: string;
  accountType: 'worker' | 'manager';
  name: string;
  email?: string;
  phone?: string;
}) {
  return api.post<SignupResponse>('/auth/signup', body);
}

export function getMe() {
  return api.get<MeResponse>('/auth/me');
}
