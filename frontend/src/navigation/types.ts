import type { StackScreenProps } from '@react-navigation/stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// Auth Stack (공통 C-1~C-4)
export type AuthStackParamList = {
  Splash: undefined;
  WalletConnect: undefined;
  AccountType: undefined;
  ProfileSetup: { accountType: 'worker' | 'manager' };
};

// Worker Tab (알바생 홈 탭)
export type WorkerTabParamList = {
  WorkerHome: undefined;
  WorkerAttendance: { storeId: string };
  WorkerExtraWork: { storeId: string };
  WorkerPortfolio: undefined;
};

// Worker Stack
export type WorkerStackParamList = {
  WorkerTab: undefined;
  StoreConnect: undefined;
  StoreLanding: { storeId: string };
  QRScanner: { storeId: string };
};

// Manager Tab (사장님 홈 탭)
export type ManagerTabParamList = {
  ManagerHome: undefined;
  ManagerVerify: undefined;
};

// Manager Stack
export type ManagerStackParamList = {
  ManagerTab: undefined;
  StoreRegister: undefined;
  StoreManagement: { storeId: string };
  ManagerVerifyQR: undefined;
  ManagerHR: { storeId: string };
  ManagerAttendance: { storeId: string };
  ManagerExtraWork: { storeId: string };
  ManagerQR: { storeId: string };
  LevelUpApproval: { storeId: string };
  CareerReport: { userId: string };
};

// Root
export type RootStackParamList = {
  Auth: undefined;
  Worker: undefined;
  Manager: undefined;
};

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  StackScreenProps<AuthStackParamList, T>;

export type WorkerScreenProps<T extends keyof WorkerStackParamList> =
  StackScreenProps<WorkerStackParamList, T>;

export type WorkerTabScreenProps<T extends keyof WorkerTabParamList> =
  BottomTabScreenProps<WorkerTabParamList, T>;

export type ManagerScreenProps<T extends keyof ManagerStackParamList> =
  StackScreenProps<ManagerStackParamList, T>;

export type ManagerTabScreenProps<T extends keyof ManagerTabParamList> =
  BottomTabScreenProps<ManagerTabParamList, T>;
