import { api } from './api';
import type { Store, StaffAssignment } from '../types';

export function getStoresByManager(managerId: string) {
  return api.get<Store[]>(`/stores/manager/${managerId}`);
}

export function getStoreByCode(storeCode: string) {
  return api.get<Store>(`/stores/code/${storeCode}`);
}

export function createStore(body: {
  name: string;
  category: string;
  sub_category: string;
  address: string;
  latitude: number;
  longitude: number;
  gps_radius_meters: number;
  business_number?: string;
  contact?: string;
}) {
  return api.post<Store>('/stores', body);
}

export function getStaffByStore(storeId: string) {
  return api.get<StaffAssignment[]>(`/staff-assignments/store/${storeId}`);
}

export function createStaffAssignment(body: { user_id: string; store_id: string }) {
  return api.post<StaffAssignment>('/staff-assignments', body);
}

export function approveStaffAssignment(assignmentId: string, body: { approved: boolean }) {
  return api.patch<StaffAssignment>(`/staff-assignments/${assignmentId}/approve`, body);
}
