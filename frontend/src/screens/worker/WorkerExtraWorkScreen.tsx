import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { colors } from '../../constants/theme';
import {
  getExtraWorkRequests, getMyExtraWorkApplications,
  applyExtraWork,
  type ExtraWorkRequest, type ExtraWorkApplication,
} from '../../services/extraWorkService';
import { getMyStaffAssignments } from '../../services/storeService';
import { useAuthStore } from '../../store/authStore';
import type { WorkerTabScreenProps } from '../../navigation/types';

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export default function WorkerExtraWorkScreen({ navigation }: WorkerTabScreenProps<'WorkerExtraWork'>) {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<ExtraWorkRequest[]>([]);
  const [applications, setApplications] = useState<ExtraWorkApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const assignments = await getMyStaffAssignments(user.id).catch(() => []);
      const activeStoreIds = assignments.filter(a => a.status === 'active').map(a => a.store_id);
      const allRequests = (await Promise.all(
        activeStoreIds.map(id => getExtraWorkRequests(id).catch(() => []))
      )).flat();
      const myApps = await getMyExtraWorkApplications().catch(() => []);
      setRequests(allRequests);
      setApplications(myApps);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user]);

  const appliedIds = new Set(applications.map(a => a.extra_work_request_id));

  const handleApply = async (requestId: string) => {
    setApplying(requestId);
    try {
      const app = await applyExtraWork(requestId);
      setApplications(prev => [...prev, app]);
    } catch (e: any) {
      Alert.alert('신청 실패', e?.message ?? '다시 시도해 주세요.');
    } finally {
      setApplying(null);
    }
  };

  const available = requests.filter(r => !appliedIds.has(r.id));
  const applied = requests.filter(r => appliedIds.has(r.id));

  return (
    <View className="flex-1" style={{ backgroundColor: colors.neutral[50] }}>
      <View className="flex-row items-center px-5 pt-14 pb-3 border-b" style={{ backgroundColor: colors.neutral[0], borderColor: colors.neutral[100] }}>
        <Text className="flex-1 font-bold text-base" style={{ color: colors.neutral[900] }}>추가 근무</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand[600]} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          <View className="px-4 pt-4 pb-2">
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.neutral[500] }}>신청 가능 ({available.length})</Text>
          </View>

          {available.length === 0 ? (
            <View className="mx-4 mb-3 p-4 rounded-2xl items-center" style={{ backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[100] }}>
              <Text style={{ fontSize: 13, color: colors.neutral[400] }}>신청 가능한 추가 근무가 없습니다</Text>
            </View>
          ) : available.map(item => (
            <View key={item.id} className="mx-4 mb-2.5 rounded-2xl p-4" style={{ backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[100] }}>
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.neutral[900] }}>
                    {formatDateTime(item.start_time)} – {new Date(item.end_time).getHours().toString().padStart(2, '0')}:{new Date(item.end_time).getMinutes().toString().padStart(2, '0')}
                  </Text>
                  {item.description && (
                    <Text style={{ fontSize: 12, color: colors.neutral[500], marginTop: 2 }}>{item.description}</Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => handleApply(item.id)}
                  disabled={applying === item.id}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.brand[400] }}
                >
                  {applying === item.id
                    ? <ActivityIndicator size="small" color={colors.brand[600]} />
                    : <Text style={{ fontSize: 12, fontWeight: '700', color: colors.brand[700] }}>신청하기</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <View style={{ height: 8, backgroundColor: colors.neutral[100], marginVertical: 4 }} />

          <View className="px-4 pt-4 pb-2">
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.neutral[500] }}>신청 완료 ({applied.length})</Text>
          </View>

          {applied.map(item => (
            <View key={item.id} className="mx-4 mb-2.5 rounded-2xl p-4" style={{ backgroundColor: colors.neutral[50], borderWidth: 1, borderColor: colors.neutral[100], opacity: 0.75 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.neutral[500] }}>
                {formatDateTime(item.start_time)} – {new Date(item.end_time).getHours().toString().padStart(2, '0')}:{new Date(item.end_time).getMinutes().toString().padStart(2, '0')}
              </Text>
              <View style={{ marginTop: 6, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: `${colors.brand[700]}15` }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: colors.brand[700] }}>신청 완료</Text>
              </View>
            </View>
          ))}

          <View className="h-8" />
        </ScrollView>
      )}
    </View>
  );
}
