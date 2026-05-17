import { api } from './api';
import type { LevelUpRequest } from '../types';

export interface LevelUpStatus {
  current_level: number;
  pending_request?: LevelUpRequest;
  progress: {
    tenure_pct: number;
    attendance_pct: number;
    extra_work_pct: number;
  };
}

export interface PendingApproval {
  request_id: string;
  user_id: string;
  user_name: string;
  current_level: number;
  target_level: number;
  requested_at: string;
}

export interface SigningPayload {
  request_id: string;
  typed_data: Record<string, unknown>;
}

export interface CompleteSbtMintBody {
  levelUpRequestId: string;
  tokenId: string;
  metadataUri: string;
  badgeImageUri: string;
  contractAddress: string;
  transactionHash: string;
  mintedAt?: string;
}

export function getLevelUpStatus(userId: string) {
  return api.get<LevelUpStatus>(`/level-up/status/${userId}`);
}

export function getLevelUpRequestDetail(requestId: string) {
  return api.get<LevelUpRequest>(`/level-up/requests/${requestId}`);
}

export function getPendingApprovals() {
  return api.get<PendingApproval[]>('/approvals/pending');
}

export function getSigningPayload(requestId: string) {
  return api.get<SigningPayload>(`/approvals/requests/${requestId}/signing-payload`);
}

// SignApprovalDto 필드: levelUpRequestId, workerAddress, level, nonce, sig1, managerSignature (모두 optional)
export function signApproval(body: {
  levelUpRequestId?: string;
  workerAddress?: string;
  level?: number;
  nonce?: string;
  sig1?: string;
  managerSignature?: string;
}) {
  return api.post<{ success: boolean }>('/approvals/sign', body);
}

export function completeSbtMint(body: CompleteSbtMintBody) {
  return api.post<{ success: boolean }>('/sbt-tokens/complete-mint', body);
}
