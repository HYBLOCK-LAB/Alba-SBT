import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/theme';
import type { ManagerTabScreenProps } from '../../navigation/types';

function ChevronRight() {
  return (
    <View style={{ width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: 6, height: 6,
        borderTopWidth: 1.5, borderRightWidth: 1.5,
        borderColor: colors.neutral[300],
        transform: [{ rotate: '45deg' }],
      }} />
    </View>
  );
}

function StoreCard({ name, cat, staff, today, onPress }: {
  name: string; cat: string; staff: number; today: number; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      className="flex-row items-center gap-3 p-4 rounded-2xl mb-2.5"
      style={{ borderWidth: 1.5, borderColor: colors.neutral[100], backgroundColor: colors.neutral[0] }}
    >
      <View className="w-11 h-11 rounded-xl items-center justify-center" style={{ backgroundColor: colors.neutral[100] }}>
        <View style={{ width: 20, height: 20 }}>
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 13, borderWidth: 1.5, borderColor: colors.neutral[500], borderRadius: 2 }} />
          <View style={{ position: 'absolute', top: 0, left: 3, right: 3, height: 9, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderRightWidth: 1.5, borderColor: colors.neutral[500], borderTopLeftRadius: 2, borderTopRightRadius: 2 }} />
        </View>
      </View>
      <View className="flex-1">
        <Text className="text-sm font-bold" style={{ color: colors.neutral[900] }}>{name}</Text>
        <Text className="text-xs mt-0.5" style={{ color: colors.neutral[400] }}>{cat}</Text>
        <View className="flex-row gap-2.5 mt-1.5">
          <Text className="text-xs" style={{ color: colors.neutral[500] }}>재직 <Text className="font-bold" style={{ color: colors.neutral[900] }}>{staff}</Text>명</Text>
          <Text className="text-xs" style={{ color: colors.brand[600] }}>오늘 출근 <Text className="font-bold" style={{ color: colors.brand[700] }}>{today}</Text>명</Text>
        </View>
      </View>
      <ChevronRight />
    </TouchableOpacity>
  );
}

function VerifyItem({ name, sub }: { name: string; sub: string }) {
  return (
    <View
      className="flex-row items-center gap-2.5 p-3.5 rounded-xl mb-2"
      style={{ borderWidth: 1.5, borderColor: colors.neutral[100] }}
    >
      <View className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: colors.brand[50] }}>
        <View style={{ width: 14, height: 14 }}>
          <View style={{ position: 'absolute', top: 0, left: 3, width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: colors.brand[600] }} />
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderWidth: 1.5, borderColor: colors.brand[600] }} />
        </View>
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold" style={{ color: colors.neutral[900] }}>{name}</Text>
        <Text className="text-xs mt-0.5" style={{ color: colors.neutral[400] }}>{sub}</Text>
      </View>
      <ChevronRight />
    </View>
  );
}

export default function ManagerHomeScreen({ navigation }: ManagerTabScreenProps<'ManagerHome'>) {
  const [activeTab, setActiveTab] = useState<'store' | 'verify'>('store');

  return (
    <View className="flex-1" style={{ backgroundColor: colors.neutral[0] }}>
      {/* Header */}
      <View className="px-5 pt-14 pb-3 flex-row items-center justify-between" style={{ borderBottomWidth: 1, borderColor: colors.neutral[100] }}>
        <View>
          <Text className="text-base font-bold" style={{ color: colors.neutral[900] }}>안녕하세요, 홍사장님</Text>
          <Text className="text-xs font-medium" style={{ color: colors.neutral[400], fontVariant: ['tabular-nums'] }}>0x9a1b...4f22</Text>
        </View>
        <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.neutral[400], position: 'absolute', top: 0 }} />
          <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.neutral[400] }} />
          <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.neutral[400], position: 'absolute', bottom: 0 }} />
        </View>
      </View>

      {/* Home tab bar */}
      <View className="flex-row" style={{ borderBottomWidth: 1, borderColor: colors.neutral[100] }}>
        {(['store', 'verify'] as const).map((tab) => {
          const label = tab === 'store' ? '매장 관리' : '경력 검증';
          const active = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className="flex-1 items-center py-3.5"
              style={{ borderBottomWidth: active ? 2 : 0, borderBottomColor: colors.brand[700] }}
            >
              <Text className="text-sm font-semibold" style={{ color: active ? colors.brand[700] : colors.neutral[400] }}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {activeTab === 'store' ? (
        <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
          <StoreCard
            name="맥도날드 신촌점" cat="외식 · 패스트푸드" staff={3} today={2}
            onPress={() => (navigation as any).navigate('StoreManagement', { storeId: '1' })}
          />
          <StoreCard
            name="스타벅스 강남점" cat="카페" staff={5} today={4}
            onPress={() => (navigation as any).navigate('StoreManagement', { storeId: '2' })}
          />
          {/* Dashed add button */}
          <TouchableOpacity
            onPress={() => (navigation as any).navigate('StoreRegister')}
            activeOpacity={0.7}
            className="flex-row items-center justify-center gap-2 py-4 mt-1 rounded-2xl"
            style={{ borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.neutral[300] }}
          >
            <View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 12, height: 1.5, backgroundColor: colors.neutral[400], borderRadius: 1 }} />
              <View style={{ width: 1.5, height: 12, backgroundColor: colors.neutral[400], borderRadius: 1, position: 'absolute' }} />
            </View>
            <Text className="text-sm font-semibold" style={{ color: colors.neutral[500] }}>매장 등록하기</Text>
          </TouchableOpacity>
          <View style={{ height: 24 }} />
        </ScrollView>
      ) : (
        <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
          {/* Hero card */}
          <View className="rounded-2xl p-5 mb-5 items-center gap-3" style={{ backgroundColor: colors.brand[50] }}>
            <View className="w-14 h-14 rounded-2xl items-center justify-center" style={{ backgroundColor: `${colors.brand[700]}20` }}>
              <View style={{ width: 28, height: 28 }}>
                <View style={{ position: 'absolute', top: 0, left: 0, width: 11, height: 11, borderWidth: 2, borderColor: colors.brand[700], borderRadius: 2 }} />
                <View style={{ position: 'absolute', top: 0, right: 0, width: 11, height: 11, borderWidth: 2, borderColor: colors.brand[700], borderRadius: 2 }} />
                <View style={{ position: 'absolute', bottom: 0, left: 0, width: 11, height: 11, borderWidth: 2, borderColor: colors.brand[700], borderRadius: 2 }} />
                <View style={{ position: 'absolute', bottom: 2, right: 2, width: 7, height: 7, borderWidth: 2, borderColor: colors.brand[700], borderRadius: 1 }} />
              </View>
            </View>
            <View className="items-center">
              <Text className="text-base font-bold mb-1.5" style={{ color: colors.neutral[900] }}>지원자 경력 검증</Text>
              <Text className="text-xs text-center leading-relaxed" style={{ color: colors.neutral[500] }}>
                포트폴리오 QR을 스캔하면{'\n'}EAS/SBT 신뢰도 리포트를 즉시 조회합니다
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => (navigation as any).navigate('ManagerVerifyQR')}
              activeOpacity={0.8}
              className="flex-row items-center justify-center gap-1.5 py-3 rounded-xl w-full"
              style={{ backgroundColor: colors.brand[700] }}
            >
              <Text className="text-sm font-bold text-white">QR 스캔 시작</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: colors.neutral[500] }}>최근 검증 내역</Text>
          <VerifyItem name="김알바" sub="Lv.2 성실 알바생 · 2026.05.05 검증" />
          <VerifyItem name="이근면" sub="Lv.1 · 2026.05.03 검증" />
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </View>
  );
}
