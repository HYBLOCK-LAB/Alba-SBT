import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/theme';
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
          borderWidth: 1.5, borderColor: active ? colors.brand[600] : colors.neutral[400],
          borderRadius: 2,
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
        width: 6, height: 6,
        borderTopWidth: 1.5, borderRightWidth: 1.5,
        borderColor: colors.neutral[300],
        transform: [{ rotate: '45deg' }],
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
        <View
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </View>
    </View>
  );
}

export default function WorkerHomeScreen({ navigation }: WorkerTabScreenProps<'WorkerHome'>) {
  return (
    <View className="flex-1" style={{ backgroundColor: colors.neutral[50] }}>
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-5 pt-14 pb-3"
        style={{ backgroundColor: colors.neutral[0] }}
      >
        <Text className="text-lg font-bold" style={{ color: colors.neutral[900] }}>홈</Text>
        <Text className="text-xs font-medium font-mono" style={{ color: colors.neutral[400] }}>
          0x3f2a...8c14
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* 내 매장 */}
        <View className="px-5 pt-5 pb-2" style={{ backgroundColor: colors.neutral[0] }}>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-bold" style={{ color: colors.neutral[900] }}>내 매장</Text>
            <TouchableOpacity onPress={() => (navigation as any).navigate('StoreConnect')}>
              <Text className="text-sm font-semibold" style={{ color: colors.brand[600] }}>+ 매장 연결</Text>
            </TouchableOpacity>
          </View>

          {/* Active store */}
          <TouchableOpacity
            onPress={() => (navigation as any).navigate('StoreLanding', { storeId: '1' })}
            activeOpacity={0.75}
            className="flex-row items-center gap-3 p-3.5 rounded-2xl mb-2"
            style={{ backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[100] }}
          >
            <StoreIcon active />
            <View className="flex-1">
              <Text className="text-sm font-bold" style={{ color: colors.neutral[900] }}>맥도날드 신촌점</Text>
              <Text className="text-xs mt-0.5" style={{ color: colors.neutral[400] }}>외식 · 패스트푸드</Text>
            </View>
            <ChevronRight />
          </TouchableOpacity>

          {/* Pending store */}
          <View
            className="flex-row items-center gap-3 p-3.5 rounded-2xl mb-2"
            style={{ backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[100] }}
          >
            <StoreIcon active={false} />
            <View className="flex-1">
              <Text className="text-sm font-bold" style={{ color: colors.neutral[500] }}>스타벅스 강남점</Text>
              <View
                className="self-start mt-1.5 px-2 py-0.5 rounded-full border"
                style={{ borderColor: colors.amber[500] }}
              >
                <Text className="text-xs font-semibold" style={{ color: colors.amber[600] }}>승인 대기</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={{ height: 8, backgroundColor: colors.neutral[100] }} />

        {/* 경력 프로필 */}
        <View className="px-5 pt-5 pb-6" style={{ backgroundColor: colors.neutral[0] }}>
          <Text className="text-sm font-bold mb-3" style={{ color: colors.neutral[900] }}>경력 프로필</Text>

          {/* Level card */}
          <View
            className="flex-row items-center justify-between p-4 rounded-2xl mb-3"
            style={{ backgroundColor: colors.brand[50] }}
          >
            <View>
              <Text className="font-extrabold" style={{ fontSize: 28, color: colors.brand[700], lineHeight: 32 }}>
                Lv.2
              </Text>
              <Text className="text-xs font-medium mt-1" style={{ color: colors.brand[600] }}>성실 알바생</Text>
            </View>
            <View className="flex-row gap-2">
              {/* Star icon */}
              <View
                className="w-9 h-9 rounded-xl items-center justify-center"
                style={{ backgroundColor: colors.amber[100] }}
              >
                <View style={{
                  width: 18, height: 18,
                  borderWidth: 1.5, borderColor: colors.amber[500],
                  transform: [{ rotate: '45deg' }],
                  borderRadius: 2,
                }} />
              </View>
              {/* Shield icon */}
              <View
                className="w-9 h-9 rounded-xl items-center justify-center"
                style={{ backgroundColor: colors.brand[100] }}
              >
                <View style={{
                  width: 14, height: 16,
                  borderWidth: 1.5, borderColor: colors.brand[500],
                  borderRadius: 3,
                  borderBottomLeftRadius: 7,
                  borderBottomRightRadius: 7,
                }} />
              </View>
            </View>
          </View>

          {/* Progress bars */}
          <View className="mb-3">
            <ProgressBar label="6개월 근속" pct={79} color={colors.brand[600]} />
            <ProgressBar label="성실 인증" pct={33} color={colors.success} />
            <ProgressBar label="추가 근무 수락" pct={80} color={colors.amber[500]} />
          </View>

          {/* Portfolio button */}
          <TouchableOpacity
            onPress={() => (navigation as any).navigate('WorkerTab', { screen: 'WorkerPortfolio' })}
            activeOpacity={0.75}
            className="flex-row items-center justify-center gap-2 py-3.5 rounded-2xl border"
            style={{ borderColor: colors.neutral[200] }}
          >
            <View style={{
              width: 16, height: 16,
              borderWidth: 1.5, borderColor: colors.neutral[600],
              borderRadius: 3,
            }} />
            <Text className="text-sm font-semibold" style={{ color: colors.neutral[700] }}>
              포트폴리오 QR 공유
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}
