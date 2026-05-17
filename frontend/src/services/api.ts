import { API_BASE_URL } from '../constants/config';
import { useAuthStore } from '../store/authStore';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body?.message ?? `HTTP ${res.status}`);
  }

  // 백엔드 응답이 { success, data } 형태인 경우 unwrap
  if ('success' in body && 'data' in body) return body.data as T;
  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
};
