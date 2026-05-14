import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../../constants/theme';
import type { ManagerScreenProps } from '../../navigation/types';

const TABS = ['인사 관리', '근태 관리', '추가 근무', 'QR 생성', '승급 승인'];

// 간단한 QR 패턴 (14x14 grid, 1=black, 0=white)
const QR_PATTERN: number[][] = [
  [1,1,1,1,1,1,1,0,1,1,1,1,1,1],
  [1,0,0,0,0,0,1,0,0,1,0,1,0,1],
  [1,0,1,1,1,0,1,0,1,0,1,0,1,1],
  [1,0,1,1,1,0,1,0,0,1,1,0,0,1],
  [1,0,0,0,0,0,1,0,1,0,1,1,0,1],
  [1,1,1,1,1,1,1,0,0,1,0,1,1,0],
  [0,0,0,0,0,0,0,0,1,0,1,0,0,1],
  [1,0,1,1,0,1,0,1,0,1,0,1,0,1],
  [0,1,1,0,1,0,1,0,1,1,0,0,1,0],
  [1,0,0,1,0,1,1,0,1,0,1,1,0,1],
  [0,1,0,0,1,0,0,1,0,1,0,0,1,1],
  [1,1,1,1,1,1,1,0,1,0,1,0,0,1],
  [1,0,0,0,0,0,1,0,0,1,1,0,1,0],
  [1,0,1,1,1,0,1,1,0,0,0,1,0,1],
];

function QRGrid() {
  const cellSize = 8;
  return (
    <View style={{ width: cellSize * 14 + 16, height: cellSize * 14 + 16, padding: 8, backgroundColor: '#fff', position: 'relative' }}>
      {QR_PATTERN.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {row.map((cell, c) => (
            <View key={c} style={{ width: cellSize, height: cellSize, backgroundColor: cell ? '#111827' : 'transparent', borderRadius: 1 }} />
          ))}
        </View>
      ))}
      {/* 중앙 로고 */}
      <View style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: [{ translateX: -14 }, { translateY: -14 }],
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: colors.brand[700],
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 3,
        elevation: 3,
      }}>
        <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: colors.brand[400] }} />
      </View>
    </View>
  );
}

export default function ManagerQRScreen({ navigation }: ManagerScreenProps<'ManagerQR'>) {
  const [timer, setTimer] = useState(30);
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!active) return;
    if (timer === 0) { setActive(false); return; }
    const id = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer, active]);

  const handleRegenerate = () => { setTimer(30); setActive(true); };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.neutral[0] }}>
      {/* 상단바 */}
      <View className="flex-row items-center gap-3 px-5 pt-14 pb-3 border-b" style={{ borderColor: colors.neutral[100] }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <View style={{ width: 18, height: 18, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: 9, height: 9, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: colors.neutral[600], transform: [{ rotate: '45deg' }] }} />
          </View>
        </TouchableOpacity>
        <Text className="flex-1 text-base font-bold" style={{ color: colors.neutral[900] }}>맥도날드 신촌점</Text>
      </View>

      {/* 5탭 */}
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

      {/* 콘텐츠 */}
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, alignItems: 'center' }}>
        {/* QR 카드 */}
        <View style={{
          backgroundColor: '#fff', borderRadius: 24, padding: 24,
          alignItems: 'center', width: '100%',
          shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 16,
          elevation: 8, marginBottom: 16,
        }}>
          <QRGrid />

          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.neutral[500], marginTop: 14, letterSpacing: 2 }}>
            A3K9F2
          </Text>

          {active ? (
            <>
              <Text style={{ fontSize: 52, fontWeight: '800', color: colors.brand[700], lineHeight: 64, marginTop: 8, fontVariant: ['tabular-nums'] }}>
                {String(timer).padStart(2, '0')}
              </Text>
              <Text style={{ fontSize: 13, color: colors.neutral[400] }}>초 후 만료</Text>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 32, fontWeight: '800', color: colors.neutral[300], marginTop: 8 }}>만료됨</Text>
              <Text style={{ fontSize: 13, color: colors.neutral[400] }}>재생성 버튼을 눌러주세요</Text>
            </>
          )}
        </View>

        {/* 재생성 버튼 */}
        <TouchableOpacity
          onPress={handleRegenerate}
          className="w-full py-4 rounded-2xl items-center border mb-4"
          style={{ borderColor: colors.brand[300] }}
        >
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.brand[700] }}>QR 재생성</Text>
        </TouchableOpacity>

        {/* 안내 텍스트 */}
        <Text style={{ fontSize: 12, color: colors.neutral[400], textAlign: 'center', lineHeight: 18 }}>
          QR은 30초간 유효합니다.{'\n'}직원이 앱에서 스캔하면 출퇴근이 기록됩니다.
        </Text>
      </ScrollView>
    </View>
  );
}
