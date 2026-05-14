import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { colors } from '../../constants/theme';
import type { WorkerScreenProps } from '../../navigation/types';

export default function StoreConnectScreen({ navigation }: WorkerScreenProps<'StoreConnect'>) {
  const [code, setCode] = useState('');

  const handleSubmit = () => {
    if (code.length !== 6) return;
    // TODO: POST /api/staff-assignments with store_code
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Dimmed background */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => navigation.goBack()}
        className="flex-1"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      />

      {/* Bottom sheet */}
      <View
        className="rounded-t-3xl px-5 pt-4 pb-8"
        style={{ backgroundColor: colors.neutral[0] }}
      >
        {/* Handle */}
        <View
          className="self-center w-10 h-1 rounded-full mb-5"
          style={{ backgroundColor: colors.neutral[200] }}
        />

        <Text className="text-lg font-bold text-center mb-2" style={{ color: colors.neutral[900] }}>
          매장 연결하기
        </Text>
        <Text className="text-sm text-center mb-5 leading-relaxed" style={{ color: colors.neutral[500] }}>
          사장님에게 받은 6자리 코드를 입력하세요
        </Text>

        {/* Code input */}
        <TextInput
          value={code}
          onChangeText={(v) => setCode(v.replace(/[^0-9]/g, '').slice(0, 6))}
          placeholder="000000"
          placeholderTextColor={colors.neutral[300]}
          keyboardType="number-pad"
          maxLength={6}
          className="text-center rounded-2xl border px-5 mb-3"
          style={{
            fontSize: 28,
            fontWeight: '700',
            letterSpacing: 12,
            paddingVertical: 16,
            borderColor: code.length === 6 ? colors.brand[400] : colors.neutral[200],
            backgroundColor: colors.neutral[50],
            color: colors.neutral[900],
          }}
        />

        <Text className="text-xs text-center mb-5 leading-relaxed" style={{ color: colors.neutral[400] }}>
          코드는 사장님 앱 → 매장 관리 → 인사 관리에서{'\n'}확인할 수 있어요
        </Text>

        {/* Submit */}
        <TouchableOpacity
          onPress={handleSubmit}
          activeOpacity={0.8}
          className="py-4 rounded-2xl items-center mb-3"
          style={{ backgroundColor: code.length === 6 ? colors.brand[700] : colors.neutral[200] }}
        >
          <Text
            className="font-bold text-base"
            style={{ color: code.length === 6 ? '#fff' : colors.neutral[400] }}
          >
            연결 요청 보내기
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} className="py-2 items-center">
          <Text className="text-sm font-medium" style={{ color: colors.neutral[400] }}>취소</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
