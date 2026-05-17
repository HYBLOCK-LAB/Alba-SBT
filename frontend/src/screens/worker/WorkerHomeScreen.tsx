import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { getMyStaffAssignments } from '../../services/storeService';
import { getLevelUpStatus, type LevelUpStatus } from '../../services/levelUpService';
import { shortenAddress } from '../../services/siwe';
import type { Store } from '../../types';
import type { WorkerTabScreenProps } from '../../navigation/types';

function StoreIcon({ active }: { active: boolean }) {
  return (
    <View
      className="w-10 h-10 rounded-xl items-center justify-center"
      style={{ backgroundColor: active ? colors.brand[50] : colors.neutral[100] }}
    >
      <View style={{ width: 20, height: 20 }}>
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 12,
          borderWidth: 1.5, borderColor: active ? colors.brand[600] : colors.neutral[400], borderRadius: 2,
        }} />
        <View style={{
          position: 'absolute', top: 0, left: 3, right: 3, height: 8,
          borderTopWidth: 1.5, borderLeftWidth: 1.5, borderRightWidth: 1.5,
          borderColor: active ? colors.brand[600] : colors.neutral[400],
          borderTopLeftRadius: 2, borderTopRightRadius: 2,
        }} />
      </View>
    </View>
  );
}

function ChevronRight() {
  return (
    <View style={{ width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: 6, height: 6, borderTopWidth: 1.5, borderRightWidth: 1.5,
        borderColor: colors.neutral[300], transform: [{ rotate: '45deg' }],
      }} />
    </View>
  );
}

function ProgressBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <View className="mb-3">
      <View className="flex-row justify-between items-center mb-1.5">
        <Text className="text-xs" style={{ color: colors.neutral[600] }}>{label}</Text>
        <Text className="text-xs font-semibold" style={{ color }}>{pct}%</Text>
      </View>
      <View className="h-1.5 rounded-full" style={{ backgroundColor: colors.neutral[200] }}>
        <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </View>
    </View>
  );
}

export default function WorkerHomeScreen({ navigation }: WorkerTabScreenProps<'WorkerHome'>) {
  const { user, walletAddress } = useAuthStore();
  const [stores, setStores] = useState<Store[]>([]);
  const [levelStatus, setLevelStatus] = useState<LevelUpStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getMyStaffAssignments(user.id).catch(() => []),
      getLevelUpStatus(user.id).catch(() => null),
    ]).then(([assignments, l]) => {
      // store 정보는 assignment에 포함되거나, 별도로 가져와야 함
      // 임시: store_id만 있는 경우 name 표시 불가 → 백엔드 응답에 store 정보 포함 가정
      const storeList = assignments.map((a: any) => a.store ?? { id: a.store_id, name: a.store_id, category: '', deleted_at: null });
      setStores(storeList as Store[]);
      setLevelStatus(l);
    }).finally(() => setLoading(false));
  }, [user]);

  const activeStores = stores.filter(s => !s.deleted_at);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.neutral[50] }}>
      <View
        className="flex-row items-center justify-between px-5 pt-14 pb-3"
        style={{ backgroundColor: colors.neutral[0] }}
      >
        <Text className="text-lg font-bold" style={{ color: colors.neutral[900] }}>홈</Text>
        <Text className="text-xs font-medium font-mono" style={{ color: colors.neutral[400] }}>
          {walletAddress ? shortenAddress(walletAddress) : ''}
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand[600]} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {/* 내 매장 */}
          <View className="px-5 pt-5 pb-2" style={{ backgroundColor: colors.neutral[0] }}>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-bold" style={{ color: colors.neutral[900] }}>내 매장</Text>
              <TouchableOpacity onPress={() => (navigation as any).navigate('StoreConnect')}>
                <Text className="text-sm font-semibold" style={{ color: colors.brand[600] }}>+ 매장 연결</Text>
              </TouchableOpacity>
            </View>

            {activeStores.length === 0 ? (
              <View className="items-center py-6">
                <Text className="text-sm" style={{ color: colors.neutral[400] }}>연결된 매장이 없습니다</Text>
              </View>
            ) : (
              activeStores.map(store => (
                <TouchableOpacity
                  key={store.id}
                  onPress={() => (navigation as any).navigate('StoreLanding', { storeId: store.id })}
                  activeOpacity={0.75}
                  className="flex-row items-center gap-3 p-3.5 rounded-2xl mb-2"
                  style={{ backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[100] }}
                >
                  <StoreIcon active />
                  <View className="flex-1">
                    <Text className="text-sm font-bold" style={{ color: colors.neutral[900] }}>{store.name}</Text>
                    <Text className="text-xs mt-0.5" style={{ color: colors.neutral[400] }}>{store.category}</Text>
                  </View>
                  <ChevronRight />
                </TouchableOpacity>
              ))
            )}
          </View>

          <View style={{ height: 8, backgroundColor: colors.neutral[100] }} />

          {/* 경력 프로필 */}
          <View className="px-5 pt-5 pb-6" style={{ backgroundColor: colors.neutral[0] }}>
            <Text className="text-sm font-bold mb-3" style={{ color: colors.neutral[900] }}>경력 프로필</Text>

            <View className="flex-row items-center justify-between p-4 rounded-2xl mb-3" style={{ backgroundColor: colors.brand[50] }}>
              <View>
                <Text className="font-extrabold" style={{ fontSize: 28, color: colors.brand[700], lineHeight: 32 }}>
                  Lv.{levelStatus?.current_level ?? 1}
                </Text>
                <Text className="text-xs font-medium mt-1" style={{ color: colors.brand[600] }}>
                  {levelStatus?.current_level === 1 ? '신입 알바생' :
                   levelStatus?.current_level === 2 ? '성실 알바생' : '베테랑 알바생'}
                </Text>
              </View>
              <View className="flex-row gap-2">
                <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: colors.amber[100] }}>
                  <View style={{ width: 18, height: 18, borderWidth: 1.5, borderColor: colors.amber[500], transform: [{ rotate: '45deg' }], borderRadius: 2 }} />
                </View>
                <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: colors.brand[100] }}>
                  <View style={{ width: 14, height: 16, borderWidth: 1.5, borderColor: colors.brand[500], borderRadius: 3, borderBottomLeftRadius: 7, borderBottomRightRadius: 7 }} />
                </View>
              </View>
            </View>

            {levelStatus?.progress && (
              <View className="mb-3">
                <ProgressBar label="6개월 근속" pct={levelStatus.progress.tenure_pct} color={colors.brand[600]} />
                <ProgressBar label="성실 인증" pct={levelStatus.progress.attendance_pct} color={colors.success} />
                <ProgressBar label="추가 근무 수락" pct={levelStatus.progress.extra_work_pct} color={colors.amber[500]} />
              </View>
            )}

            <TouchableOpacity
              onPress={() => (navigation as any).navigate('WorkerTab', { screen: 'WorkerPortfolio' })}
              activeOpacity={0.75}
              className="flex-row items-center justify-center gap-2 py-3.5 rounded-2xl border"
              style={{ borderColor: colors.neutral[200] }}
            >
              <Text className="text-sm font-semibold" style={{ color: colors.neutral[700] }}>포트폴리오 QR 공유</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </View>
  );
}
