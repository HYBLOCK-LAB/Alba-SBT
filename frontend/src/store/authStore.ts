import { create } from 'zustand';
import type { AccountType, User } from '../types';

interface AuthState {
  token: string | null;
  walletAddress: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setToken: (token: string) => void;
  setWalletAddress: (address: string) => void;
  setUser: (user: User) => void;
  setLoading: (v: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  walletAddress: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,

  setToken: (token) => set({ token }),
  setWalletAddress: (address) => set({ walletAddress: address }),
  setUser: (user) => set({ user, isAuthenticated: true }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ token: null, walletAddress: null, user: null, isAuthenticated: false }),
}));
