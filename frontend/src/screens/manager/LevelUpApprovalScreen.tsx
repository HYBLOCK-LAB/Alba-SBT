import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { colors } from '../../constants/theme';
import {
  getPendingApprovals, getSigningPayload, signApproval,
  type PendingApproval,
} from '../../services/levelUpService';
import { useAuthStore } from '../../store/authStore';
import { getWcClient } from '../../services/walletService';
import type { ManagerScreenProps } from '../../navigation/types';

const TABS = ['인사 관리', '근태 관리', '추가 근무', 'QR 생성', '승급 승인'];

function CheckIcon({ met }: { met: boolean }) {
  return (
    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: met ? colors.success : colors.neutral[200], alignItems: 'center', justifyContent: 'center' }}>
      {met ? (
        <View style={{ width: 6, height: 9, borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: '#fff', transform: [{ rotate: '45deg' }, { translateY: -1 }] }} />
      ) : (
        <View style={{ width: 8, height: 1.5, backgroundColor: colors.neutral[400], borderRadius: 1 }} />
      )}
    </View>
  );
}

function UserAvatar() {
  return (
    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.brand[50], alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: colors.brand[600] }} />
      <View style={{ width: 20, height: 8, borderTopLeftRadius: 10, borderTopRightRadius: 10, borderWidth: 1.5, borderColor: colors.brand[600], marginTop: -2 }} />
    </View>
  );
}

export default function LevelUpApprovalScreen({ navigation, route }: ManagerScreenProps<'LevelUpApproval'>) {
  const { storeName } = (route.params ?? {}) as { storeName?: string };
  const { walletAddress } = useAuthStore();
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState<string | null>(null);

  useEffect(() => {
    getPendingApprovals()
      .then(setApprovals)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSign = async (approval: PendingApproval) => {
    if (!walletAddress) return;
    setSigning(approval.request_id);
    try {
      const { typed_data } = await getSigningPayload(approval.request_id);
      const client = await getWcClient();
      const sessions = client.session.getAll();
      if (!sessions.length) {
        Alert.alert('오류', '지갑이 연결되어 있지 않습니다.');
        return;
      }
      const session = sessions[0];
      const signature = await client.request<string>({
        topic: session.topic,
        chainId: 'eip155:11155111',
        request: {
          method: 'eth_signTypedData_v4',
          params: [walletAddress, JSON.stringify(typed_data)],
        },
      });
      await signApproval({ levelUpRequestId: approval.request_id, managerSignature: signature });
      setApprovals(prev => prev.filter(a => a.request_id !== approval.request_id));
      Alert.alert('승인 완료', `${approval.user_name}의 승급을 승인했습니다.`);
    } catch (e: any) {
      Alert.alert('서명 실패', e?.message ?? '다시 시도해 주세요.');
    } finally {
      setSigning(null);
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.neutral[0] }}>
      <View className="flex-row items-center gap-3 px-5 pt-14 pb-3 border-b" style={{ borderColor: colors.neutral[100] }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <View style={{ width: 18, height: 18, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: 9, height: 9, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: colors.neutral[600], transform: [{ rotate: '45deg' }] }} />
          </View>
        </TouchableOpacity>
        <Text className="flex-1 text-base font-bold" style={{ color: colors.neutral[900] }}>{storeName ?? '승급 승인'}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexShrink: 0, borderBottomWidth: 1, borderColor: colors.neutral[100] }}>
        {TABS.map((tab) => (
          <View key={tab} style={{ paddingHorizontal: 14, paddingVertical: 11, position: 'relative' }}>
            <Text style={{ fontSize: 11, fontWeight: tab === '승급 승인' ? '700' : '600', color: tab === '승급 승인' ? colors.brand[700] : colors.neutral[400] }}>{tab}</Text>
            {tab === '승급 승인' && <View style={{ position: 'absolute', bottom: 0, left: 10, right: 10, height: 2, backgroundColor: colors.brand[700], borderRadius: 2 }} />}
          </View>
        ))}
      </ScrollView>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand[600]} />
        </View>
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {approvals.length === 0 ? (
            <View className="items-center py-12">
              <Text style={{ fontSize: 14, color: colors.neutral[400] }}>대기 중인 승급 요청이 없습니다</Text>
            </View>
          ) : approvals.map(approval => (
            <View key={approval.request_id} className="rounded-2xl border p-4 mb-4" style={{ borderColor: colors.neutral[200] }}>
              <View className="flex-row items-center gap-3 mb-4">
                <UserAvatar />
                <View className="flex-1">
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.neutral[900] }}>{approval.user_name}</Text>
                  <Text style={{ fontSize: 11, color: colors.neutral[400], marginTop: 1 }}>
                    Lv.{approval.current_level} → Lv.{approval.target_level} 승급 요청
                  </Text>
                </View>
                <Text style={{ fontSize: 10, color: colors.neutral[400] }}>
                  {new Date(approval.requested_at).toLocaleDateString('ko-KR')}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => handleSign(approval)}
                disabled={signing === approval.request_id}
                className="py-4 rounded-2xl items-center"
                style={{ backgroundColor: colors.brand[700] }}
              >
                {signing === approval.request_id
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>서명 후 승인</Text>
                }
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
