import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/theme';
import type { ManagerScreenProps } from '../../navigation/types';

const STORE_TABS = ['인사 관리', '근태 관리', '추가 근무', 'QR 생성', '승급 승인'];
const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const TODAY = 9;

// May 2026: starts Thursday (day 4)
const MAY_START = 4; // 0=Sun
const MAY_DAYS = 31;

type DotType = 'attend' | 'absent' | 'none';
const DOT_MAP: Record<number, DotType> = {
  1: 'attend', 2: 'attend', 5: 'attend', 6: 'attend',
  7: 'attend', 8: 'attend', 20: 'absent',
};

function StatCard({ value, unit, label }: { value: string; unit: string; label: string }) {
  return (
    <View className="flex-1 items-center py-2.5 rounded-xl" style={{ borderWidth: 1.5, borderColor: colors.neutral[100] }}>
      <Text style={{ fontSize: 18, fontWeight: '800', color: colors.neutral[900] }}>
        {value}<Text style={{ fontSize: 12, fontWeight: '500' }}>{unit}</Text>
      </Text>
      <Text className="text-xs mt-0.5" style={{ color: colors.neutral[400] }}>{label}</Text>
    </View>
  );
}

function AttRow({ name, time, badge }: { name: string; time: string; badge: { label: string; color: string; border: string } }) {
  return (
    <View className="flex-row items-center gap-2.5 py-2.5" style={{ borderBottomWidth: 1, borderColor: colors.neutral[100] }}>
      <Text style={{ width: 52, fontSize: 13, fontWeight: '600', color: colors.neutral[900] }}>{name}</Text>
      <Text className="flex-1 text-xs" style={{ color: colors.neutral[500], fontVariant: ['tabular-nums'] }}>{time}</Text>
      <View className="px-2 py-0.5 rounded" style={{ borderWidth: 1, borderColor: badge.border }}>
        <Text className="text-xs font-semibold" style={{ color: badge.color }}>{badge.label}</Text>
      </View>
    </View>
  );
}

export default function ManagerAttendanceScreen({ navigation }: ManagerScreenProps<'ManagerAttendance'>) {
  const cells: { day: number | null; isToday: boolean; dot: DotType; isSun: boolean; isSat: boolean }[] = [];
  for (let i = 0; i < MAY_START; i++) cells.push({ day: null, isToday: false, dot: 'none', isSun: false, isSat: false });
  for (let d = 1; d <= MAY_DAYS; d++) {
    const col = (MAY_START + d - 1) % 7;
    cells.push({ day: d, isToday: d === TODAY, dot: DOT_MAP[d] ?? 'none', isSun: col === 0, isSat: col === 6 });
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.neutral[0] }}>
      {/* Header */}
      <View className="flex-row items-center gap-2.5 px-5 pt-14 pb-3" style={{ borderBottomWidth: 1, borderColor: colors.neutral[100] }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <View style={{ width: 7, height: 7, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: colors.neutral[600], transform: [{ rotate: '45deg' }] }} />
        </TouchableOpacity>
        <Text className="flex-1 text-base font-bold" style={{ color: colors.neutral[900] }}>맥도날드 신촌점</Text>
      </View>

      {/* 5-tab */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ borderBottomWidth: 1, borderColor: colors.neutral[100] }} contentContainerStyle={{ paddingHorizontal: 4 }}>
        {STORE_TABS.map((tab, i) => (
          <TouchableOpacity key={tab} className="px-3.5 py-2.5" style={{ borderBottomWidth: i === 1 ? 2 : 0, borderBottomColor: colors.brand[700] }}>
            <Text className="text-xs font-semibold" style={{ color: i === 1 ? colors.brand[700] : colors.neutral[400] }}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView className="flex-1 px-4 pt-3.5" showsVerticalScrollIndicator={false}>
        {/* Summary */}
        <View className="flex-row gap-2 mb-4">
          <StatCard value="87" unit="%" label="출근율" />
          <StatCard value="3" unit="회" label="지각" />
          <StatCard value="2" unit="회" label="결근" />
        </View>

        {/* Calendar */}
        <View className="rounded-2xl p-3.5 mb-3.5" style={{ borderWidth: 1.5, borderColor: colors.neutral[100] }}>
          <View className="flex-row items-center justify-between mb-2.5">
            <View style={{ width: 7, height: 7, borderLeftWidth: 1.5, borderBottomWidth: 1.5, borderColor: colors.neutral[400], transform: [{ rotate: '45deg' }] }} />
            <Text className="text-sm font-bold" style={{ color: colors.neutral[900] }}>2026년 5월</Text>
            <View style={{ width: 7, height: 7, borderRightWidth: 1.5, borderTopWidth: 1.5, borderColor: colors.neutral[400], transform: [{ rotate: '45deg' }] }} />
          </View>

          {/* Day headers */}
          <View className="flex-row mb-1">
            {DAYS.map((d, i) => (
              <Text key={d} className="flex-1 text-center" style={{ fontSize: 10, fontWeight: '600', color: i === 0 ? colors.error : i === 6 ? '#3b82f6' : colors.neutral[400] }}>{d}</Text>
            ))}
          </View>

          {/* Grid */}
          <View className="flex-row flex-wrap">
            {cells.map((cell, idx) => (
              <View key={idx} style={{ width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' }}>
                {cell.day !== null && (
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: cell.isToday ? colors.brand[700] : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{
                      fontSize: 11, fontWeight: cell.isToday ? '700' : '500',
                      color: cell.isToday ? '#fff' : cell.isSun ? colors.error : cell.isSat ? '#3b82f6' : colors.neutral[700],
                    }}>{cell.day}</Text>
                    {cell.dot !== 'none' && !cell.isToday && (
                      <View style={{ position: 'absolute', bottom: 1, width: 3, height: 3, borderRadius: 1.5, backgroundColor: cell.dot === 'attend' ? colors.brand[300] : colors.error }} />
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Today attendance */}
        <Text className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: colors.neutral[500] }}>금일 출근 현황</Text>
        <View className="rounded-xl px-3.5 mb-6" style={{ borderWidth: 1.5, borderColor: colors.neutral[100] }}>
          <AttRow name="홍길동" time="09:02 출근" badge={{ label: '출근', color: '#15803d', border: '#86efac' }} />
          <AttRow name="김민지" time="—" badge={{ label: '결근', color: colors.neutral[500], border: colors.neutral[300] }} />
          <View className="flex-row items-center gap-2.5 py-2.5">
            <Text style={{ width: 52, fontSize: 13, fontWeight: '600', color: colors.neutral[900] }}>박성실</Text>
            <Text className="flex-1 text-xs" style={{ color: colors.neutral[500] }}>09:15 출근</Text>
            <View className="px-2 py-0.5 rounded" style={{ borderWidth: 1, borderColor: '#fcd34d' }}>
              <Text className="text-xs font-semibold" style={{ color: '#92400e' }}>지각</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
