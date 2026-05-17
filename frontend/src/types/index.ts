export type AccountType = 'worker' | 'manager';

export interface User {
  id: string;
  account_type: AccountType;
  name: string;
  email?: string;
  phone?: string;
  wallet_address: string;
  created_at: string;
}

export interface Store {
  id: string;
  manager_id: string;
  name: string;
  store_code: string;
  category: StoreCategory;
  sub_category: string;
  address: string;
  latitude: number;
  longitude: number;
  gps_radius_meters: number;
  business_number?: string;
  contact?: string;
  created_at: string;
  deleted_at?: string;
}

export type StoreCategory =
  | 'fnb'
  | 'retail'
  | 'production'
  | 'service'
  | 'culture'
  | 'office'
  | 'education';

export interface StaffAssignment {
  id: string;
  user_id: string;
  store_id: string;
  status: 'pending' | 'active' | 'inactive';
  approved_at?: string;
  created_at: string;
}

export interface Attendance {
  id: string;
  user_id: string;
  store_id: string;
  schedule_id?: string;
  type: 'regular' | 'extra';
  status: 'on_time' | 'late' | 'absent';
  clock_in_time: string;
  clock_out_time?: string;
  clock_in_gps_verified: boolean;
  clock_out_gps_verified?: boolean;
  created_at: string;
}

export interface EasAttestation {
  id: string;
  user_id: string;
  store_id?: string;
  eas_type: 'EAS_EXP_TIME' | 'EAS_FAITH_ATT' | 'EAS_WORK_COMP' | 'EAS_EXTRA_ACC';
  eas_uid: string;
  attestation_data: Record<string, unknown>;
  issued_at: string;
  transaction_hash?: string;
  status: 'pending' | 'issued' | 'failed';
}

export interface LevelUpRequest {
  id: string;
  user_id: string;
  current_level: number;
  target_level: number;
  status: 'pending' | 'awaiting_approval' | 'multisig_signed' | 'minted' | 'rejected';
  requested_at: string;
  approved_at?: string;
  minted_at?: string;
}
