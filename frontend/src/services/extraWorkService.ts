import { api } from './api';

export interface ExtraWorkRequest {
  id: string;
  store_id: string;
  start_time: string;
  end_time: string;
  description?: string;
  created_at: string;
}

export interface ExtraWorkApplication {
  id: string;
  extra_work_request_id: string;
  user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export function createExtraWorkRequest(body: {
  store_id: string;
  start_time: string;
  end_time: string;
  description?: string;
}) {
  return api.post<ExtraWorkRequest>('/extra-work/requests', body);
}

export function getExtraWorkRequests(storeId: string) {
  return api.get<ExtraWorkRequest[]>(`/extra-work/requests?storeId=${storeId}`);
}

export function applyExtraWork(extraWorkRequestId: string) {
  return api.post<ExtraWorkApplication>('/extra-work/applications', { extraWorkRequestId });
}

export function getMyExtraWorkApplications() {
  return api.get<ExtraWorkApplication[]>('/extra-work/applications/me');
}

export function getStoreExtraWorkApplications(storeId: string) {
  return api.get<ExtraWorkApplication[]>(`/extra-work/stores/${storeId}/applications`);
}

export function acceptExtraWorkApplication(applicationId: string) {
  return api.post<ExtraWorkApplication>('/extra-work/applications/accept', { applicationId });
}
