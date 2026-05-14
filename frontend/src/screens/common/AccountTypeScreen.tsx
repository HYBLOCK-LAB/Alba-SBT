import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../../constants/theme';
import type { AuthScreenProps } from '../../navigation/types';
import type { AccountType } from '../../types';

interface TypeCardProps {
  type: AccountType;
  selected: boolean;
  onSelect: () => void;
}

function CheckIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: 5, height: 8,
        borderBottomWidth: 1.5, borderRightWidth: 1.5,
        borderColor: color,
        transform: [{ rotate: '45deg' }, { translateY: -1 }],
      }} />
    </View>
  );
}

function FeatureItem({ label, selected }: { label: string; selected: boolean }) {
  return (
    <View className="flex-row items-center gap-2">
      <View
        className="w-4 h-4 rounded-full items-center justify-center"
        style={{ backgroundColor: selected ? colors.brand[700] : colors.brand[100] }}
      >
        <CheckIcon color={selected ? '#fff' : colors.brand[400]} />
      </View>
      <Text className="text-xs" style={{ color: colors.neutral[600] }}>{label}</Text>
    </View>
  );
}

function TypeCard({ type, selected, onSelect }: TypeCardProps) {
  const isWorker = type === 'worker';
  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.8}
      className="rounded-3xl p-5 border"
      style={{
        borderColor: selected ? colors.brand[700] : colors.neutral[200],
        backgroundColor: selected ? colors.brand[50] : colors.neutral[0],
        borderWidth: 1.5,
      }}
    >
      <View className="flex-row items-center gap-3.5 mb-3">
        <View
          className="w-12 h-12 rounded-2xl items-center justify-center"
          style={{ backgroundColor: isWorker ? colors.amber[100] : colors.teal[100] }}
        >
          <View
            className="w-6 h-6 rounded-lg"
            style={{ backgroundColor: isWorker ? colors.amber[500] : colors.teal[500] }}
          />
        </View>
        <View>
          <Text className="text-lg font-bold" style={{ color: colors.neutral[900] }}>
            {isWorker ? '알바생' : '사장님'}
          </Text>
          <Text className="text-xs mt-0.5" style={{ color: colors.neutral[400] }}>
            {isWorker ? 'Part-time Worker' : 'Store Manager'}
          </Text>
        </View>
      </View>

      <Text className="text-xs leading-relaxed mb-3" style={{ color: colors.neutral[500] }}>
        {isWorker
          ? 'QR 출퇴근으로 경력을 자동 적립하고 블록체인 증명서를 발급받으세요.'
          : '매장을 등록하고 알바생의 출퇴근을 관리하며 경력 검증을 손쉽게 진행하세요.'}
      </Text>

      <View className="gap-1.5">
        {isWorker
          ? ['QR 출퇴근 등록', '월별 근태 캘린더', 'SBT 경력 배지 자동 발급', '포트폴리오 QR 공유'].map(f => (
              <FeatureItem key={f} label={f} selected={selected} />
            ))
          : ['매장 등록 및 관리', '알바생 인사 관리', 'QR 출퇴근 코드 생성', '지원자 경력 즉시 검증'].map(f => (
              <FeatureItem key={f} label={f} selected={selected} />
            ))}
      </View>
    </TouchableOpacity>
  );
}

export default function AccountTypeScreen({ navigation }: AuthScreenProps<'AccountType'>) {
  const [selected, setSelected] = useState<AccountType | null>(null);

  const handleNext = () => {
    if (!selected) return;
    navigation.navigate('ProfileSetup', { accountType: selected });
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.neutral[50] }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-12 pb-5">
          <Text className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: colors.brand[500] }}>
            Step 1 of 3
          </Text>
          <Text className="text-2xl font-extrabold tracking-tight mb-2" style={{ color: colors.neutral[900] }}>
            계정 유형 선택
          </Text>
          <Text className="text-sm leading-relaxed" style={{ color: colors.neutral[400] }}>
            한 번 선택한 계정 유형은 변경할 수 없습니다.{'\n'}신중하게 선택해 주세요.
          </Text>
        </View>

        {/* Type cards */}
        <View className="px-5 gap-3">
          <TypeCard type="worker" selected={selected === 'worker'} onSelect={() => setSelected('worker')} />
          <TypeCard type="manager" selected={selected === 'manager'} onSelect={() => setSelected('manager')} />
        </View>

        {/* Warning */}
        <View className="mx-5 mt-4 flex-row gap-2 items-start p-3 rounded-xl border" style={{ borderColor: colors.neutral[200] }}>
          <View style={{ width: 14, height: 14, marginTop: 1 }}>
            <View style={{
              width: 14, height: 14, borderRadius: 7,
              borderWidth: 1.5, borderColor: colors.warning,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 8, fontWeight: '700', color: colors.warning }}>!</Text>
            </View>
          </View>
          <Text className="flex-1 text-xs leading-relaxed" style={{ color: colors.neutral[500] }}>
            계정 유형은 가입 후 변경이 불가합니다. 잘못 선택한 경우 새 지갑 주소로 재가입해야 합니다.
          </Text>
        </View>

        {/* Next button */}
        <View className="px-5 pt-5 pb-10">
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.8}
            className="py-4 rounded-2xl items-center"
            style={{ backgroundColor: selected ? colors.brand[700] : colors.neutral[200] }}
          >
            <Text
              className="font-bold text-base"
              style={{ color: selected ? '#fff' : colors.neutral[400] }}
            >
              다음 단계
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
