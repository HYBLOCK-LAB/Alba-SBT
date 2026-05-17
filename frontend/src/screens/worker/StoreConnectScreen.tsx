import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, Alert, ActivityIndicator,
} from 'react-native';
import { colors } from '../../constants/theme';
import { getStoreByCode, createStaffAssignment } from '../../services/storeService';
import { useAuthStore } from '../../store/authStore';
import type { WorkerScreenProps } from '../../navigation/types';

export default function StoreConnectScreen({ navigation }: WorkerScreenProps<'StoreConnect'>) {
  const { user } = useAuthStore();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (code.length !== 6 || !user) return;
    setLoading(true);
    try {
      const store = await getStoreByCode(code);
      await createStaffAssignment({ user_id: user.id, store_id: store.id });
      Alert.alert('연결 요청 완료', `${store.name}에 연결 요청을 보냈습니다.\n사장님 승인 후 이용 가능합니다.`, [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('연결 실패', e?.message ?? '유효하지 않은 코드이거나 이미 연결된 매장입니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableOpacity activeOpacity={1} onPress={() => navigation.goBack()} className="flex-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />

      <View className="rounded-t-3xl px-5 pt-4 pb-8" style={{ backgroundColor: colors.neutral[0] }}>
        <View className="self-center w-10 h-1 rounded-full mb-5" style={{ backgroundColor: colors.neutral[200] }} />

        <Text className="text-lg font-bold text-center mb-2" style={{ color: colors.neutral[900] }}>
          매장 연결하기
        </Text>
        <Text className="text-sm text-center mb-5 leading-relaxed" style={{ color: colors.neutral[500] }}>
          사장님에게 받은 6자리 코드를 입력하세요
        </Text>

        <TextInput
          value={code}
          onChangeText={(v) => setCode(v.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6))}
          placeholder="000000"
          placeholderTextColor={colors.neutral[300]}
          autoCapitalize="characters"
          maxLength={6}
          className="text-center rounded-2xl border px-5 mb-3"
          style={{
            fontSize: 28, fontWeight: '700', letterSpacing: 12, paddingVertical: 16,
            borderColor: code.length === 6 ? colors.brand[400] : colors.neutral[200],
            backgroundColor: colors.neutral[50], color: colors.neutral[900],
          }}
        />

        <Text className="text-xs text-center mb-5 leading-relaxed" style={{ color: colors.neutral[400] }}>
          코드는 사장님 앱 → 매장 관리 → 인사 관리에서{'\n'}확인할 수 있어요
        </Text>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={code.length !== 6 || loading}
          activeOpacity={0.8}
          className="py-4 rounded-2xl items-center mb-3"
          style={{ backgroundColor: code.length === 6 ? colors.brand[700] : colors.neutral[200] }}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text className="font-bold text-base" style={{ color: code.length === 6 ? '#fff' : colors.neutral[400] }}>
                연결 요청 보내기
              </Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} className="py-2 items-center">
          <Text className="text-sm font-medium" style={{ color: colors.neutral[400] }}>취소</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
