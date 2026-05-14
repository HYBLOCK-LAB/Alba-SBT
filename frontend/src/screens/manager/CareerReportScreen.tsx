import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { colors } from '../../constants/theme';
import type { ManagerScreenProps } from '../../navigation/types';

const EAS_ITEMS = [
  { type: 'EAS_EXP_TIME', desc: '맥도날드 신촌점 · 6개월', date: '2026.05.01 발급' },
  { type: 'EAS_FAITH_ATT', desc: '90일 연속 성실', date: '2026.05.01 발급' },
];

const BADGES = [
  { icon: 'star', label: '6개월 근속', locked: false },
  { icon: 'shield', label: '성실 인증', locked: false },
  { icon: 'lock', label: '완근 인증', locked: true },
];

function StarIcon({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: size * 0.5, height: size * 0.5, backgroundColor: color, transform: [{ rotate: '45deg' }], borderRadius: 2 }} />
      <View style={{ position: 'absolute', width: size * 0.5, height: size * 0.5, backgroundColor: color, transform: [{ rotate: '0deg' }], borderRadius: 2 }} />
    </View>
  );
}

function ShieldIcon({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: size * 0.65, height: size * 0.75, borderWidth: 2, borderColor: color, borderRadius: size * 0.2, borderBottomLeftRadius: size * 0.3, borderBottomRightRadius: size * 0.3 }} />
    </View>
  );
}

function LockIcon({ size = 20, color = '#888' }: { size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: size * 0.55, height: size * 0.45, borderWidth: 1.5, borderColor: color, borderRadius: 2 }} />
      <View style={{ width: size * 0.35, height: size * 0.3, borderTopLeftRadius: size * 0.18, borderTopRightRadius: size * 0.18, borderWidth: 1.5, borderColor: color, borderBottomWidth: 0, marginBottom: -1 }} />
    </View>
  );
}

function BadgeIcon({ icon, locked }: { icon: string; locked: boolean }) {
  const bg = locked ? colors.neutral[200] : colors.brand[700];
  const iconColor = locked ? colors.neutral[400] : '#fff';
  return (
    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      {icon === 'star' && <StarIcon size={18} color={iconColor} />}
      {icon === 'shield' && <ShieldIcon size={18} color={iconColor} />}
      {icon === 'lock' && <LockIcon size={18} color={iconColor} />}
    </View>
  );
}

export default function CareerReportScreen({ navigation, route }: ManagerScreenProps<'CareerReport'>) {
  const { userId } = route.params;
  return (
    <View className="flex-1">
      {/* 프로필 히어로 */}
      <View style={{ backgroundColor: colors.brand[900] ?? '#05284e', paddingBottom: 20 }}>
        {/* 상단바 */}
        <View className="flex-row items-center gap-3 px-5 pt-14 pb-4">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <View style={{ width: 18, height: 18, justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ width: 9, height: 9, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: '#fff', transform: [{ rotate: '45deg' }] }} />
            </View>
          </TouchableOpacity>
          <Text className="flex-1 text-base font-bold" style={{ color: '#fff' }}>경력 리포트</Text>
        </View>

        {/* 이름 & 레벨 */}
        <View className="px-5 mb-5">
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 }}>김알바</Text>
          <Text style={{ fontSize: 13, fontWeight: '500', color: colors.brand[300] }}>Lv.2 성실 알바생</Text>
        </View>

        {/* 3분할 통계 */}
        <View className="flex-row mx-5 rounded-2xl overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
          {[
            { num: '4개월', label: '총 근무' },
            { num: '96%', label: '출근율' },
            { num: '8회', label: '추가근무' },
          ].map((s, i) => (
            <View key={s.label} className="flex-1 items-center py-3" style={{ borderLeftWidth: i > 0 ? 1 : 0, borderColor: 'rgba(255,255,255,0.1)' }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: '#fff', lineHeight: 22 }}>{s.num}</Text>
              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 스크롤 콘텐츠 */}
      <ScrollView className="flex-1" style={{ backgroundColor: colors.neutral[0] }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* EAS 뱃지 */}
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.neutral[500], textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>EAS 증명</Text>
        {EAS_ITEMS.map((eas) => (
          <View key={eas.type} className="flex-row items-center gap-3 p-3.5 rounded-xl border mb-2" style={{ borderColor: colors.neutral[100] }}>
            <View className="px-2 py-0.5 rounded border" style={{ borderColor: '#86efac' }}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: '#15803d' }}>{eas.type}</Text>
            </View>
            <View className="flex-1">
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.neutral[800] }}>{eas.desc}</Text>
              <Text style={{ fontSize: 10, color: colors.neutral[400], marginTop: 1 }}>{eas.date}</Text>
            </View>
          </View>
        ))}

        <View style={{ height: 16 }} />

        {/* 근무 이력 */}
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.neutral[500], textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>근무 이력</Text>
        <View className="p-4 rounded-2xl border mb-4" style={{ borderColor: colors.neutral[100] }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.neutral[900] }}>맥도날드 신촌점</Text>
          <Text style={{ fontSize: 11, color: colors.neutral[400], marginTop: 2 }}>2025.11 – 2026.05 · 6개월</Text>
          <Text style={{ fontSize: 11, color: colors.neutral[500], marginTop: 1 }}>외식 · 패스트푸드</Text>
        </View>

        {/* 획득 배지 */}
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.neutral[500], textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>획득 배지</Text>
        <View className="flex-row gap-2 mb-5">
          {BADGES.map((badge) => (
            <View key={badge.label} className="flex-1 items-center p-3 rounded-2xl border" style={{ borderColor: colors.neutral[100], opacity: badge.locked ? 0.4 : 1 }}>
              <BadgeIcon icon={badge.icon} locked={badge.locked} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.neutral[800], marginTop: 6, textAlign: 'center' }}>{badge.label}</Text>
            </View>
          ))}
        </View>

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
