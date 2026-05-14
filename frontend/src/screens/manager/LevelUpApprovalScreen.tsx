import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../../constants/theme';
import type { ManagerScreenProps } from '../../navigation/types';

const TABS = ['인사 관리', '근태 관리', '추가 근무', 'QR 생성', '승급 승인'];

const CONDITIONS = [
  { label: '6개월 근속 달성', met: true },
  { label: '성실 인증 (90일 연속)', met: true },
  { label: '완근 인증 달성', met: true },
  { label: '추가 근무 10회', met: false },
];

function CheckIcon({ met }: { met: boolean }) {
  return (
    <View style={{
      width: 20, height: 20, borderRadius: 10,
      backgroundColor: met ? colors.success : colors.neutral[200],
      alignItems: 'center', justifyContent: 'center',
    }}>
      {met ? (
        <View style={{
          width: 6, height: 9,
          borderRightWidth: 1.5, borderBottomWidth: 1.5,
          borderColor: '#fff',
          transform: [{ rotate: '45deg' }, { translateY: -1 }],
        }} />
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

export default function LevelUpApprovalScreen({ navigation }: ManagerScreenProps<'LevelUpApproval'>) {
  return (
    <View className="flex-1" style={{ backgroundColor: colors.neutral[0] }}>
      {/* 상단바 */}
      <View className="flex-row items-center gap-3 px-5 pt-14 pb-3 border-b" style={{ borderColor: colors.neutral[100] }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <View style={{ width: 18, height: 18, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: 9, height: 9, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: colors.neutral[600], transform: [{ rotate: '45deg' }] }} />
          </View>
        </TouchableOpacity>
        <Text className="flex-1 text-base font-bold" style={{ color: colors.neutral[900] }}>맥도날드 신촌점</Text>
      </View>

      {/* 5탭 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexShrink: 0, borderBottomWidth: 1, borderColor: colors.neutral[100] }}>
        {TABS.map((tab) => (
          <View key={tab} style={{ paddingHorizontal: 14, paddingVertical: 11, position: 'relative' }}>
            <Text style={{
              fontSize: 11, fontWeight: tab === '승급 승인' ? '700' : '600',
              color: tab === '승급 승인' ? colors.brand[700] : colors.neutral[400],
            }}>{tab}</Text>
            {tab === '승급 승인' && (
              <View style={{ position: 'absolute', bottom: 0, left: 10, right: 10, height: 2, backgroundColor: colors.brand[700], borderRadius: 2 }} />
            )}
          </View>
        ))}
      </ScrollView>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* 승급 요청 카드 */}
        <View className="rounded-2xl border p-4 mb-4" style={{ borderColor: colors.neutral[200] }}>
          {/* 요청자 정보 */}
          <View className="flex-row items-center gap-3 mb-4">
            <UserAvatar />
            <View className="flex-1">
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.neutral[900] }}>홍길동</Text>
              <Text style={{ fontSize: 11, color: colors.neutral[400], marginTop: 1 }}>Lv.2 → Lv.3 승급 요청</Text>
            </View>
            <Text style={{ fontSize: 10, color: colors.neutral[400] }}>2026.05.08</Text>
          </View>

          {/* 조건 체크리스트 */}
          <View className="mb-4 gap-2.5">
            {CONDITIONS.map((c) => (
              <View key={c.label} className="flex-row items-center gap-2.5">
                <CheckIcon met={c.met} />
                <Text style={{ fontSize: 13, color: c.met ? colors.neutral[700] : colors.neutral[400] }}>{c.label}</Text>
              </View>
            ))}
          </View>

          {/* 경고 알림 */}
          <View className="flex-row rounded-xl mb-4 overflow-hidden" style={{ backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200] }}>
            <View style={{ width: 3, backgroundColor: colors.warning }} />
            <View className="flex-1 p-3">
              <Text style={{ fontSize: 11, color: colors.neutral[600], lineHeight: 17 }}>
                추가 근무 10회 조건 미달 상태에서 승인 시 해당 EAS는 미발급됩니다.
              </Text>
            </View>
          </View>

          {/* 승인 버튼 */}
          <TouchableOpacity className="py-4 rounded-2xl items-center" style={{ backgroundColor: colors.brand[700] }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>서명 후 승인</Text>
          </TouchableOpacity>
        </View>

        {/* 완료된 승급 내역 */}
        <View>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.neutral[400], textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
            완료된 승급 내역
          </Text>
          <View className="px-4 py-3 rounded-xl" style={{ backgroundColor: colors.neutral[50] }}>
            <Text style={{ fontSize: 12, color: colors.neutral[400] }}>홍길동 · Lv.1 → Lv.2 · 2026.02.10</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
