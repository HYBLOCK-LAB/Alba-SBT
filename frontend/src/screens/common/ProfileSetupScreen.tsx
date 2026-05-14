import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { colors } from '../../constants/theme';
import type { AuthScreenProps } from '../../navigation/types';

function StepBar({ step }: { step: number }) {
  return (
    <View className="flex-row gap-1 mb-5">
      {[1, 2, 3].map(s => (
        <View
          key={s}
          className="flex-1 h-0.5 rounded-full"
          style={{
            backgroundColor:
              s < step ? colors.brand[700] :
              s === step ? colors.brand[400] :
              colors.neutral[200],
          }}
        />
      ))}
    </View>
  );
}

function WalletDisplay({ address }: { address: string }) {
  const short = `${address.slice(0, 6)}...${address.slice(-4)}`;
  return (
    <View
      className="flex-row items-center justify-between p-4 rounded-2xl mb-5"
      style={{ backgroundColor: colors.neutral[100] }}
    >
      <View>
        <Text className="text-xs mb-1" style={{ color: colors.neutral[400] }}>연결된 지갑</Text>
        <Text className="font-mono text-sm font-semibold" style={{ color: colors.neutral[700] }}>
          {short}
        </Text>
      </View>
      <View
        className="px-2.5 py-1 rounded-full"
        style={{ backgroundColor: `${colors.success}15` }}
      >
        <Text className="text-xs font-semibold" style={{ color: colors.success }}>연결됨</Text>
      </View>
    </View>
  );
}

function InputField({
  label,
  placeholder,
  value,
  onChangeText,
  required,
  keyboardType,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  required?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
}) {
  return (
    <View className="mb-4">
      <View className="flex-row items-center gap-1 mb-1.5">
        <Text className="text-sm font-semibold" style={{ color: colors.neutral[700] }}>{label}</Text>
        {required && <Text style={{ color: colors.error, fontSize: 13 }}>*</Text>}
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.neutral[300]}
        keyboardType={keyboardType ?? 'default'}
        className="px-4 py-3.5 rounded-xl border text-sm"
        style={{
          borderColor: colors.neutral[200],
          backgroundColor: colors.neutral[0],
          color: colors.neutral[800],
          fontSize: 14,
        }}
      />
    </View>
  );
}

export default function ProfileSetupScreen({ navigation, route }: AuthScreenProps<'ProfileSetup'>) {
  const { accountType } = route.params;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const mockWallet = '0x742d35Cc6634C053279';

  const handleComplete = () => {
    if (!name.trim()) return;
    // TODO: POST /api/users with wallet_address, name, email, phone, account_type
    const rootNav = (navigation as any).getParent();
    rootNav?.reset({
      index: 0,
      routes: [{ name: accountType === 'manager' ? 'Manager' : 'Worker' }],
    });
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: colors.neutral[50] }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-6 pt-12 pb-5">
          <StepBar step={3} />
          <Text className="text-2xl font-extrabold tracking-tight mb-2" style={{ color: colors.neutral[900] }}>
            기본 정보 입력
          </Text>
          <Text className="text-sm leading-relaxed mb-6" style={{ color: colors.neutral[400] }}>
            이름은 경력 증명서에 표시됩니다.{'\n'}이메일·전화번호는 선택 사항입니다.
          </Text>

          <WalletDisplay address={mockWallet} />

          <InputField
            label="이름"
            placeholder="실명을 입력해 주세요"
            value={name}
            onChangeText={setName}
            required
          />
          <InputField
            label="이메일"
            placeholder="example@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <InputField
            label="전화번호"
            placeholder="010-0000-0000"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        <View className="px-6 pb-12">
          <TouchableOpacity
            onPress={handleComplete}
            activeOpacity={0.8}
            className="py-4 rounded-2xl items-center"
            style={{ backgroundColor: name.trim() ? colors.brand[700] : colors.neutral[200] }}
          >
            <Text
              className="font-bold text-base"
              style={{ color: name.trim() ? '#fff' : colors.neutral[400] }}
            >
              가입 완료
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
