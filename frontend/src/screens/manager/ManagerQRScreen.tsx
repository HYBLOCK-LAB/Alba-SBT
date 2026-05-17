import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { colors } from '../../constants/theme';
import { createQrToken, type QrToken } from '../../services/qrService';
import type { ManagerScreenProps } from '../../navigation/types';

const TABS = ['인사 관리', '근태 관리', '추가 근무', 'QR 생성', '승급 승인'];
const QR_TTL = 10; // 백엔드 기본값과 동일

export default function ManagerQRScreen({ navigation, route }: ManagerScreenProps<'ManagerQR'>) {
  const { storeId, storeName } = route.params as { storeId: string; storeName: string };
  const [qrToken, setQrToken] = useState<QrToken | null>(null);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const token = await createQrToken(storeId);
      setQrToken(token);
      setTimer(QR_TTL);
    } catch (e: any) {
      Alert.alert('오류', e?.message ?? 'QR 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => { generate(); }, [generate]);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const expired = timer <= 0;
  // QR에 담을 데이터: storeId + token
  const qrData = qrToken ? JSON.stringify({ storeId, token: qrToken.token }) : '';

  return (
    <View className="flex-1" style={{ backgroundColor: colors.neutral[0] }}>
      <View className="flex-row items-center gap-3 px-5 pt-14 pb-3 border-b" style={{ borderColor: colors.neutral[100] }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <View style={{ width: 18, height: 18, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: 9, height: 9, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: colors.neutral[600], transform: [{ rotate: '45deg' }] }} />
          </View>
        </TouchableOpacity>
        <Text className="flex-1 text-base font-bold" style={{ color: colors.neutral[900] }}>{storeName}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexShrink: 0, borderBottomWidth: 1, borderColor: colors.neutral[100] }}>
        {TABS.map((tab) => (
          <View key={tab} style={{ paddingHorizontal: 14, paddingVertical: 11, position: 'relative' }}>
            <Text style={{
              fontSize: 11, fontWeight: tab === 'QR 생성' ? '700' : '600',
              color: tab === 'QR 생성' ? colors.brand[700] : colors.neutral[400],
            }}>{tab}</Text>
            {tab === 'QR 생성' && (
              <View style={{ position: 'absolute', bottom: 0, left: 10, right: 10, height: 2, backgroundColor: colors.brand[700], borderRadius: 2 }} />
            )}
          </View>
        ))}
      </ScrollView>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, alignItems: 'center' }}>
        <View style={{
          backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center', width: '100%',
          shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 16,
          elevation: 8, marginBottom: 16,
        }}>
          {loading ? (
            <View style={{ width: 160, height: 160, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={colors.brand[600]} size="large" />
            </View>
          ) : qrData && !expired ? (
            <QRCode value={qrData} size={160} color="#111827" backgroundColor="#fff" />
          ) : (
            <View style={{ width: 160, height: 160, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 32, fontWeight: '800', color: colors.neutral[300] }}>만료됨</Text>
            </View>
          )}

          {!expired && qrToken && (
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.neutral[500], marginTop: 14, letterSpacing: 2 }}>
              {qrToken.token.slice(0, 6).toUpperCase()}
            </Text>
          )}

          {!expired ? (
            <>
              <Text style={{ fontSize: 52, fontWeight: '800', color: colors.brand[700], lineHeight: 64, marginTop: 8, fontVariant: ['tabular-nums'] }}>
                {String(timer).padStart(2, '0')}
              </Text>
              <Text style={{ fontSize: 13, color: colors.neutral[400] }}>초 후 만료</Text>
            </>
          ) : (
            <Text style={{ fontSize: 13, color: colors.neutral[400], marginTop: 8 }}>재생성 버튼을 눌러주세요</Text>
          )}
        </View>

        <TouchableOpacity
          onPress={generate}
          disabled={loading}
          className="w-full py-4 rounded-2xl items-center border mb-4"
          style={{ borderColor: colors.brand[300] }}
        >
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.brand[700] }}>QR 재생성</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 12, color: colors.neutral[400], textAlign: 'center', lineHeight: 18 }}>
          QR은 {QR_TTL}초간 유효합니다.{'\n'}직원이 앱에서 스캔하면 출퇴근이 기록됩니다.
        </Text>
      </ScrollView>
    </View>
  );
}
