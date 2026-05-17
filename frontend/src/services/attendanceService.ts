import { api } from './api';
import type { Attendance } from '../types';

export interface MonthlyAttendanceSummary {
  records: Attendance[];
  total_days: number;
  late_count: number;
  absent_count: number;
}

export interface StoreTodayStatus {
  present: { user_id: string; name: string; clock_in_time: string }[];
  absent: { user_id: string; name: string }[];
}

export function clockIn(body: { store_id: string; qr_token: string; latitude: number; longitude: number }) {
  return api.post<Attendance>('/attendance/clock-in', body);
}

export function clockOut(body: { store_id: string; latitude: number; longitude: number }) {
  return api.post<Attendance>('/attendance/clock-out', body);
}

export function getMyMonthlyAttendance(year: number, month: number) {
  return api.get<MonthlyAttendanceSummary>(`/attendance/me/month?year=${year}&month=${month}`);
}

export function getStoreTodayStatus(storeId: string) {
  return api.get<StoreTodayStatus>(`/attendance/stores/${storeId}/today`);
}
