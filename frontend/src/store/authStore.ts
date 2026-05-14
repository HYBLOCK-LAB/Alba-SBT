import { create } from 'zustand';
import type { AccountType, User } from '../types';

interface AuthState {
  walletAddress: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setWalletAddress: (address: string) => void;
  setUser: (user: User) => void;
  setLoading: (v: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  walletAddress: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,

  setWalletAddress: (address) => set({ walletAddress: address }),
  setUser: (user) => set({ user, isAuthenticated: true }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ walletAddress: null, user: null, isAuthenticated: false }),
}));
