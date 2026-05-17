import { apiClient } from './api';

export interface EasAttestationItem {
  easType: string;
  storeName: string | null;
  category: string | null;
  description: string;
  issuedAt: string;
  easUid: string | null;
}

export interface WorkHistoryItem {
  storeId: string;
  storeName: string;
  category: string | null;
  subCategory: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
}

export interface CareerReport {
  userId: string;
  name: string;
  currentLevel: number;
  stats: {
    tenureMonths: number;
    attendancePct: number | null;
    extraWorkCount: number;
  };
  easAttestations: EasAttestationItem[];
  workHistory: WorkHistoryItem[];
}

export async function getCareerReport(userId: string): Promise<CareerReport> {
  const res = await apiClient.get(`/career-report/${userId}`);
  return res.data;
}
