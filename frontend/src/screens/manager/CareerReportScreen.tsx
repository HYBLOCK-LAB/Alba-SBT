import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking, ActivityIndicator } from 'react-native';
import { colors } from '../../constants/theme';
import type { ManagerScreenProps } from '../../navigation/types';
import { getCareerReport, CareerReport } from '../../services/careerReportService';

const EAS_TYPE_LABELS: Record<string, string> = {
  EAS_EXP_TIME: '근속 증명',
  EAS_FAITH_ATT: '성실 인증',
  EAS_WORK_COMP: '업무 완수',
  EAS_EXTRA_ACC: '추가근무 인증',
};

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} 발급`;
}

function formatWorkPeriod(start: string | null, end: string | null): string {
  if (!start) return '-';
  const fmt = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
  };
  return `${fmt(start)} – ${end ? fmt(end) : '현재'}`;
}

export default function CareerReportScreen({ navigation, route }: ManagerScreenProps<'CareerReport'>) {
  const { userId } = route.params;
  const [report, setReport] = useState<CareerReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCareerReport(userId)
      .then(setReport)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.brand[700]} />
      </View>
    );
  }

  const name = report?.name ?? '알 수 없음';
  const level = report?.currentLevel ?? 1;
  const tenureMonths = report?.stats.tenureMonths ?? 0;
  const attendancePct = report?.stats.attendancePct;
  const extraWorkCount = report?.stats.extraWorkCount ?? 0;
  const easItems = report?.easAttestations ?? [];
  const workHistory = report?.workHistory ?? [];

  return (
    <View className="flex-1">
      {/* 프로필 히어로 */}
      <View style={{ backgroundColor: colors.brand[900] ?? '#05284e', paddingBottom: 20 }}>
        <View className="flex-row items-center gap-3 px-5 pt-14 pb-4">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <View style={{ width: 18, height: 18, justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ width: 9, height: 9, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: '#fff', transform: [{ rotate: '45deg' }] }} />
            </View>
          </TouchableOpacity>
          <Text className="flex-1 text-base font-bold" style={{ color: '#fff' }}>경력 리포트</Text>
        </View>

        <View className="px-5 mb-5">
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 }}>{name}</Text>
          <Text style={{ fontSize: 13, fontWeight: '500', color: colors.brand[300] }}>Lv.{level} 알바생</Text>
        </View>

        <View className="flex-row mx-5 rounded-2xl overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
          {[
            { num: `${tenureMonths}개월`, label: '총 근무' },
            { num: attendancePct != null ? `${attendancePct}%` : '-', label: '출근율' },
            { num: `${extraWorkCount}회`, label: '추가근무' },
          ].map((s, i) => (
            <View key={s.label} className="flex-1 items-center py-3" style={{ borderLeftWidth: i > 0 ? 1 : 0, borderColor: 'rgba(255,255,255,0.1)' }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: '#fff', lineHeight: 22 }}>{s.num}</Text>
              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView className="flex-1" style={{ backgroundColor: colors.neutral[0] }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* EAS 증명 */}
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.neutral[500], textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>EAS 증명</Text>
        {easItems.length === 0 ? (
          <Text style={{ fontSize: 12, color: colors.neutral[400], marginBottom: 16 }}>발급된 EAS 증명이 없습니다.</Text>
        ) : (
          easItems.map((eas, idx) => (
            <View key={`${eas.easType}-${idx}`} className="flex-row items-center gap-3 p-3.5 rounded-xl border mb-2" style={{ borderColor: colors.neutral[100] }}>
              <View className="px-2 py-0.5 rounded border" style={{ borderColor: '#86efac' }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: '#15803d' }}>{eas.easType}</Text>
              </View>
              <View className="flex-1">
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.neutral[800] }}>{eas.description}</Text>
                <Text style={{ fontSize: 10, color: colors.neutral[400], marginTop: 1 }}>{formatDate(eas.issuedAt)}</Text>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 16 }} />

        {/* 근무 이력 */}
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.neutral[500], textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>근무 이력</Text>
        {workHistory.length === 0 ? (
          <Text style={{ fontSize: 12, color: colors.neutral[400], marginBottom: 16 }}>근무 이력이 없습니다.</Text>
        ) : (
          workHistory.map((wh, idx) => (
            <View key={idx} className="p-4 rounded-2xl border mb-3" style={{ borderColor: colors.neutral[100] }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.neutral[900] }}>{wh.storeName}</Text>
              <Text style={{ fontSize: 11, color: colors.neutral[400], marginTop: 2 }}>{formatWorkPeriod(wh.startDate, wh.endDate)}</Text>
              {wh.category && (
                <Text style={{ fontSize: 11, color: colors.neutral[500], marginTop: 1 }}>{wh.category}{wh.subCategory ? ` · ${wh.subCategory}` : ''}</Text>
              )}
            </View>
          ))
        )}

        {/* EAS Explorer 버튼 */}
        <TouchableOpacity
          onPress={() => Linking.openURL('https://sepolia.easscan.org')}
          className="flex-row items-center justify-center gap-2 py-4 rounded-2xl border"
          style={{ borderColor: colors.brand[300] }}
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.brand[700] }}>EAS Explorer에서 확인</Text>
          <View style={{ width: 12, height: 12, borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: colors.brand[500], transform: [{ rotate: '45deg' }] }} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
