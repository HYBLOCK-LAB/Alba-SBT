import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { colors } from '../../constants/theme';
import type { ManagerScreenProps } from '../../navigation/types';

const STORE_TABS = ['인사 관리', '근태 관리', '추가 근무', 'QR 생성', '승급 승인'];

function Avatar() {
  return (
    <View className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: colors.brand[50] }}>
      <View style={{ width: 13, height: 13 }}>
        <View style={{ position: 'absolute', top: 0, left: 2, width: 9, height: 9, borderRadius: 4.5, borderWidth: 1.5, borderColor: colors.brand[600] }} />
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 5, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderWidth: 1.5, borderColor: colors.brand[600] }} />
      </View>
    </View>
  );
}

function LevelBadge({ level, active }: { level: string; active?: boolean }) {
  return (
    <View className="px-2 py-0.5 rounded" style={{
      borderWidth: 1,
      borderColor: active ? colors.brand[300] : colors.neutral[300],
    }}>
      <Text className="text-xs font-semibold" style={{ color: active ? colors.brand[700] : colors.neutral[500] }}>{level}</Text>
    </View>
  );
}

function ChevronRight() {
  return (
    <View style={{ width: 13, height: 13, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 5, height: 5, borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: colors.neutral[300], transform: [{ rotate: '45deg' }] }} />
    </View>
  );
}

export default function ManagerHRScreen({ navigation }: ManagerScreenProps<'ManagerHR'>) {
  const staff = [
    { name: '홍길동', sub: '등록 2024.03.01 · 142일', level: 'Lv.2', active: true },
    { name: '김민지', sub: '등록 2025.01.15 · 88일', level: 'Lv.1', active: false },
    { name: '박성실', sub: '등록 2025.09.01 · 45일', level: 'Lv.1', active: false },
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: colors.neutral[0] }}>
      {/* Header */}
      <View className="flex-row items-center gap-2.5 px-5 pt-14 pb-3" style={{ borderBottomWidth: 1, borderColor: colors.neutral[100] }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <View style={{ width: 7, height: 7, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: colors.neutral[600], transform: [{ rotate: '45deg' }] }} />
        </TouchableOpacity>
        <Text className="flex-1 text-base font-bold" style={{ color: colors.neutral[900] }}>맥도날드 신촌점</Text>
      </View>

      {/* 5-tab scrollable */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ borderBottomWidth: 1, borderColor: colors.neutral[100] }} contentContainerStyle={{ paddingHorizontal: 4 }}>
        {STORE_TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            className="px-3.5 py-2.5"
            style={{ borderBottomWidth: i === 0 ? 2 : 0, borderBottomColor: colors.brand[700] }}
          >
            <Text className="text-xs font-semibold whitespace-nowrap" style={{ color: i === 0 ? colors.brand[700] : colors.neutral[400] }}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView className="flex-1 px-4 pt-3.5" showsVerticalScrollIndicator={false}>
        {/* 재직 중 */}
        <Text className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: colors.neutral[500] }}>
          재직 중 <Text style={{ color: colors.neutral[400], fontWeight: '500' }}>3명</Text>
        </Text>
        <View className="rounded-xl mb-3.5 overflow-hidden" style={{ borderWidth: 1.5, borderColor: colors.neutral[100] }}>
          {staff.map((s, i) => (
            <View key={s.name} className="flex-row items-center gap-2.5 px-3.5 py-3" style={i < staff.length - 1 ? { borderBottomWidth: 1, borderColor: colors.neutral[100] } : {}}>
              <Avatar />
              <View className="flex-1">
                <Text className="text-sm font-semibold" style={{ color: colors.neutral[900] }}>{s.name}</Text>
                <Text className="text-xs mt-0.5" style={{ color: colors.neutral[400] }}>{s.sub}</Text>
              </View>
              <LevelBadge level={s.level} active={s.active} />
              <ChevronRight />
            </View>
          ))}
        </View>

        {/* 승인 대기 */}
        <Text className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: colors.neutral[500] }}>
          승인 대기 <Text style={{ color: colors.neutral[400], fontWeight: '500' }}>1명</Text>
        </Text>
        <View className="flex-row items-center gap-2.5 px-3.5 py-3 rounded-xl mb-4" style={{ borderWidth: 1.5, borderColor: colors.neutral[200] }}>
          <View className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: colors.neutral[100] }}>
            <View style={{ width: 13, height: 13 }}>
              <View style={{ position: 'absolute', top: 0, left: 2, width: 9, height: 9, borderRadius: 4.5, borderWidth: 1.5, borderColor: colors.neutral[500] }} />
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 5, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderWidth: 1.5, borderColor: colors.neutral[500] }} />
            </View>
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold" style={{ color: colors.neutral[900] }}>이지원</Text>
            <Text className="text-xs mt-0.5" style={{ color: colors.neutral[400] }}>2026.05.04 연결 요청</Text>
          </View>
          <TouchableOpacity
            onPress={() => Alert.alert('승인', '이지원님을 승인하시겠습니까?')}
            className="px-2.5 py-1.5 rounded-lg"
            style={{ backgroundColor: colors.brand[700] }}
          >
            <Text className="text-xs font-semibold text-white">승인</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Alert.alert('거절', '이지원님을 거절하시겠습니까?')}
            className="px-2.5 py-1.5 rounded-lg"
            style={{ borderWidth: 1.5, borderColor: colors.neutral[200] }}
          >
            <Text className="text-xs font-semibold" style={{ color: colors.neutral[400] }}>거절</Text>
          </TouchableOpacity>
        </View>

        {/* 매장 코드 */}
        <View className="flex-row items-center justify-between px-4 py-3.5 rounded-xl mb-6" style={{ backgroundColor: colors.neutral[50] }}>
          <View>
            <Text className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: colors.neutral[400] }}>매장 코드</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: colors.neutral[900], letterSpacing: 3, fontVariant: ['tabular-nums'] }}>A3K9F2</Text>
          </View>
          <TouchableOpacity
            onPress={async () => {
              await Clipboard.setStringAsync('A3K9F2');
              Alert.alert('복사 완료', '매장 코드가 클립보드에 복사되었습니다.');
            }}
            className="flex-row items-center gap-1 px-3 py-2 rounded-lg"
            style={{ borderWidth: 1.5, borderColor: colors.brand[200] }}
          >
            <Text className="text-xs font-semibold" style={{ color: colors.brand[700] }}>복사</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
