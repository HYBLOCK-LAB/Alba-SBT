import { api } from './api';

export interface QrToken {
  token: string;
  expires_at: string;
}

export function createQrToken(storeId: string) {
  return api.post<QrToken>('/qr/tokens', { storeId });
}

export function verifyQrToken(qrToken: string, storeId: string) {
  return api.post<{ valid: boolean }>('/qr/verify', { qrToken, storeId });
}
