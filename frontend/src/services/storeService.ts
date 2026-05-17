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

// TODO: 백엔드에 GET /staff-assignments/user/:userId 엔드포인트 추가 필요
export function getMyStaffAssignments(userId: string) {
  return api.get<StaffAssignment[]>(`/staff-assignments/user/${userId}`);
}

// CreateStaffAssignmentDto: { userId, storeId, staffNumber }
export function createStaffAssignment(body: { userId: string; storeId: string; staffNumber: string }) {
  return api.post<StaffAssignment>('/staff-assignments', body);
}

export function approveStaffAssignment(assignmentId: string, body: { approved: boolean }) {
  return api.patch<StaffAssignment>(`/staff-assignments/${assignmentId}/approve`, body);
}
