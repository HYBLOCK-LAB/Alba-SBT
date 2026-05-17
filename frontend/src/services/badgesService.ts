import { api } from './api';

export interface Badge {
  id: string;
  level: number;
  name: string;
  image_url: string;
  description?: string;
}

export function getBadges() {
  return api.get<Badge[]>('/badges');
}

export function getBadgeByLevel(level: number) {
  return api.get<Badge>(`/badges/${level}`);
}
