import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  token: string | null;
  signupToken: string | null;  // 신규 유저 가입 완료 전까지 임시 보관
  walletAddress: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setToken: (token: string) => void;
  setSignupToken: (token: string) => void;
  setWalletAddress: (address: string) => void;
  setUser: (user: User) => void;
  setLoading: (v: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  signupToken: null,
  walletAddress: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,

  setToken: (token) => set({ token }),
  setSignupToken: (signupToken) => set({ signupToken }),
  setWalletAddress: (address) => set({ walletAddress: address }),
  setUser: (user) => set({ user, isAuthenticated: true }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ token: null, signupToken: null, walletAddress: null, user: null, isAuthenticated: false }),
}));
