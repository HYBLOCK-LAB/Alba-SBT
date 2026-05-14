import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { colors } from '../../constants/theme';
import type { WorkerScreenProps } from '../../navigation/types';

const TABS = ['QR 스캔', '근태 관리', '추가 근무'] as const;
type Tab = typeof TABS[number];

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const MAY_START_DOW = 5;
const MAY_DAYS = 31;
const TODAY = 9;
const ATTENDED = new Set([1, 2, 5, 6, 7, 8, 9]);
const ABSENT = new Set([3]);

function BackChevron() {
  return (
    <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 8, height: 8, borderBottomWidth: 1.8, borderLeftWidth: 1.8, borderColor: colors.neutral[600], transform: [{ rotate: '45deg' }] }} />
    </View>
  );
}

function DotsIcon() {
  return (
    <View style={{ alignItems: 'center', gap: 3 }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.neutral[500] }} />
      ))}
    </View>
  );
}

// ── QR 스캔 탭 ────────────────────────────────────────────────────────────────
function QRScanTab({ onScan }: { onScan: () => void }) {
  return (
    <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
      <Text className="text-sm font-semibold text-center mb-4" style={{ color: colors.neutral[600] }}>
        2026년 5월 6일 (수)
      </Text>
      <View className="flex-row items-center justify-between p-4 rounded-2xl mb-4" style={{ backgroundColor: colors.neutral[100] }}>
        <View>
          <Text className="text-xs mb-1" style={{ color: colors.neutral[500] }}>현재 상태</Text>
          <Text className="text-base font-bold" style={{ color: colors.neutral[900] }}>미출근</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text className="text-xs mb-1" style={{ color: colors.neutral[500] }}>출근 예정</Text>
          <Text className="text-base font-bold" style={{ color: colors.neutral[900] }}>오전 09:00</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={onScan}
        activeOpacity={0.85}
        className="flex-row items-center justify-center gap-3 py-5 rounded-2xl mb-3"
        style={{ backgroundColor: colors.brand[700], shadowColor: colors.brand[700], shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 }}
      >
        <View style={{ width: 22, height: 22, borderWidth: 2, borderColor: '#fff', borderRadius: 4 }} />
        <Text className="text-base font-bold text-white">QR 스캔으로 출근하기</Text>
      </TouchableOpacity>
      <Text className="text-xs text-center leading-relaxed" style={{ color: colors.neutral[400] }}>
        GPS 위치가 매장 반경 50m 내에 있어야 합니다
      </Text>
    </ScrollView>
  );
}

// ── 근태 관리 탭 ──────────────────────────────────────────────────────────────
const MONTHS = ['2026년 3월', '2026년 4월', '2026년 5월'];

function AttendanceTab() {
  const [monthIdx, setMonthIdx] = useState(2);
  const cells: { day: number | null; dow: number }[] = [];
  for (let i = 0; i < MAY_START_DOW; i++) cells.push({ day: null, dow: i });
  for (let d = 1; d <= MAY_DAYS; d++) cells.push({ day: d, dow: (MAY_START_DOW + d - 1) % 7 });
  while (cells.length % 7 !== 0) cells.push({ day: null, dow: cells.length % 7 });
  const rows: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* 요약 카드 */}
      <View className="flex-row mx-4 mt-4 rounded-2xl overflow-hidden" style={{ backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[100] }}>
        {[
          { label: '출근일', value: '18', color: colors.brand[700] },
          { label: '지각', value: '1', color: colors.amber[500] },
          { label: '결근', value: '0', color: colors.neutral[700] },
        ].map((item, i) => (
          <View key={item.label} className="flex-1 items-center py-4" style={{ borderLeftWidth: i > 0 ? 1 : 0, borderColor: colors.neutral[100] }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: item.color }}>{item.value}</Text>
            <Text style={{ fontSize: 11, color: colors.neutral[400], marginTop: 2 }}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* 캘린더 */}
      <View className="mx-4 mt-3 rounded-2xl p-4" style={{ backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[100] }}>
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity className="p-1" onPress={() => setMonthIdx(i => Math.max(0, i - 1))}>
            <View style={{ width: 8, height: 8, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: monthIdx === 0 ? colors.neutral[200] : colors.neutral[400], transform: [{ rotate: '45deg' }] }} />
          </TouchableOpacity>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.neutral[800] }}>{MONTHS[monthIdx]}</Text>
          <TouchableOpacity className="p-1" onPress={() => setMonthIdx(i => Math.min(MONTHS.length - 1, i + 1))}>
            <View style={{ width: 8, height: 8, borderRightWidth: 2, borderTopWidth: 2, borderColor: monthIdx === MONTHS.length - 1 ? colors.neutral[200] : colors.neutral[400], transform: [{ rotate: '45deg' }] }} />
          </TouchableOpacity>
        </View>
        <View className="flex-row mb-1">
          {DAYS.map((d, i) => (
            <Text key={d} className="flex-1 text-center" style={{ fontSize: 11, fontWeight: '600', color: i === 0 ? colors.error : i === 6 ? colors.brand[500] : colors.neutral[400] }}>{d}</Text>
          ))}
        </View>
        {rows.map((row, ri) => (
          <View key={ri} className="flex-row">
            {row.map((cell, ci) => {
              if (!cell.day) return <View key={ci} className="flex-1 items-center py-1" />;
              const isToday = cell.day === TODAY;
              const attended = ATTENDED.has(cell.day);
              const absent = ABSENT.has(cell.day);
              const textColor = isToday ? '#fff' : cell.dow === 0 ? colors.error : cell.dow === 6 ? colors.brand[500] : colors.neutral[800];
              return (
                <View key={ci} className="flex-1 items-center py-1">
                  <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: isToday ? colors.brand[700] : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 12, fontWeight: isToday ? '700' : '400', color: textColor }}>{cell.day}</Text>
                  </View>
                  {attended && !isToday && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.brand[300], marginTop: 2 }} />}
                  {absent && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.error, marginTop: 2 }} />}
                </View>
              );
            })}
          </View>
        ))}
      </View>

      {/* 오늘 근무 */}
      <View className="mx-4 mt-3 mb-6 rounded-2xl p-4" style={{ backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[100] }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.neutral[500], marginBottom: 10 }}>오늘 근무</Text>
        <View className="flex-row justify-between items-end mb-3">
          <View className="gap-0.5">
            <Text style={{ fontSize: 10, color: colors.neutral[400] }}>출근시간</Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.neutral[800] }}>09:03</Text>
          </View>
          <View className="items-center">
            <Text style={{ fontSize: 22, fontWeight: '800', color: colors.brand[700], lineHeight: 26 }}>7:12</Text>
            <Text style={{ fontSize: 10, color: colors.neutral[400] }}>잔여</Text>
          </View>
          <View className="items-end gap-0.5">
            <Text style={{ fontSize: 10, color: colors.neutral[400] }}>퇴근예정</Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.neutral[800] }}>18:00</Text>
          </View>
        </View>
        <View style={{ height: 4, backgroundColor: colors.neutral[200], borderRadius: 99 }}>
          <View style={{ height: 4, width: '2%', backgroundColor: colors.brand[500], borderRadius: 99 }} />
        </View>
      </View>
    </ScrollView>
  );
}

// ── 추가 근무 탭 ──────────────────────────────────────────────────────────────
interface ExtraItem { id: string; date: string; time: string; }
const AVAILABLE: ExtraItem[] = [
  { id: '1', date: '5월 8일 (금)', time: '13:00 – 18:00' },
  { id: '2', date: '5월 12일 (화)', time: '09:00 – 14:00' },
];
const APPLIED_ITEMS: ExtraItem[] = [
  { id: '3', date: '5월 3일 (토)', time: '10:00 – 15:00' },
];

function ExtraWorkTab() {
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const handleApply = (id: string) => setApplied(prev => new Set([...prev, id]));
  const handleCancel = (id: string) => setApplied(prev => { const s = new Set(prev); s.delete(id); return s; });

  return (
    <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
      <View className="px-4 pt-4 pb-2">
        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.neutral[500] }}>신청 가능</Text>
      </View>
      {AVAILABLE.map(item => {
        const isApplied = applied.has(item.id);
        return (
          <View key={item.id} className="mx-4 mb-2.5 rounded-2xl p-4" style={{ backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[100] }}>
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <Text style={{ fontSize: 15, fontWeight: '700', color: isApplied ? colors.neutral[400] : colors.neutral[900] }}>{item.date}</Text>
                <Text style={{ fontSize: 12, color: colors.neutral[500], marginTop: 2 }}>{item.time}</Text>
                {isApplied && (
                  <View style={{ marginTop: 6, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: `${colors.brand[700]}15` }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: colors.brand[700] }}>신청 완료</Text>
                  </View>
                )}
              </View>
              {!isApplied
                ? <TouchableOpacity onPress={() => handleApply(item.id)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.brand[400] }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.brand[700] }}>신청하기</Text>
                  </TouchableOpacity>
                : <TouchableOpacity onPress={() => handleCancel(item.id)}>
                    <Text style={{ fontSize: 12, fontWeight: '500', color: colors.neutral[400] }}>취소</Text>
                  </TouchableOpacity>
              }
            </View>
          </View>
        );
      })}
      <View style={{ height: 8, backgroundColor: colors.neutral[100], marginVertical: 4 }} />
      <View className="px-4 pt-4 pb-2">
        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.neutral[500] }}>신청 완료</Text>
      </View>
      {APPLIED_ITEMS.map(item => (
        <View key={item.id} className="mx-4 mb-2.5 rounded-2xl p-4" style={{ backgroundColor: colors.neutral[50], borderWidth: 1, borderColor: colors.neutral[100], opacity: 0.75 }}>
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.neutral[500] }}>{item.date}</Text>
              <Text style={{ fontSize: 12, color: colors.neutral[400], marginTop: 2 }}>{item.time}</Text>
            </View>
            <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: `${colors.brand[700]}15` }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.brand[700] }}>신청 완료</Text>
            </View>
          </View>
        </View>
      ))}
      <View className="h-8" />
    </ScrollView>
  );
}

// ── 메인 화면 ─────────────────────────────────────────────────────────────────
export default function StoreLandingScreen({ navigation }: WorkerScreenProps<'StoreLanding'>) {
  const [activeTab, setActiveTab] = useState<Tab>('QR 스캔');

  return (
    <View className="flex-1" style={{ backgroundColor: colors.neutral[50] }}>
      {/* Top bar */}
      <View className="flex-row items-center justify-between px-4 pt-14 pb-3 border-b" style={{ borderColor: colors.neutral[100], backgroundColor: colors.neutral[0] }}>
        <TouchableOpacity onPress={() => navigation.goBack()} className="flex-row items-center gap-2" activeOpacity={0.7}>
          <BackChevron />
          <Text className="text-base font-bold" style={{ color: colors.neutral[900] }}>맥도날드 신촌점</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="w-9 h-9 items-center justify-center"
          activeOpacity={0.7}
          onPress={() => Alert.alert('매장 옵션', '', [
            { text: '매장 연결 해제', style: 'destructive', onPress: () => {} },
            { text: '닫기', style: 'cancel' },
          ])}
        >
          <DotsIcon />
        </TouchableOpacity>
      </View>

      {/* Store hero */}
      <View className="items-center py-4 px-5 gap-1" style={{ backgroundColor: colors.brand[50] }}>
        <View className="w-14 h-14 rounded-2xl items-center justify-center mb-1" style={{ backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.brand[100] }}>
          <View style={{ width: 28, height: 22, borderWidth: 1.8, borderColor: colors.brand[600], borderRadius: 2, marginTop: 4 }} />
        </View>
        <Text className="text-xs" style={{ color: colors.neutral[500] }}>외식 · 패스트푸드</Text>
        <Text className="text-xs" style={{ color: colors.neutral[400] }}>서울 서대문구 신촌로 83</Text>
        <View className="px-3 py-0.5 rounded-full border mt-1" style={{ borderColor: colors.success }}>
          <Text className="text-xs font-semibold" style={{ color: colors.success }}>재직 중</Text>
        </View>
      </View>

      {/* Inner tab bar */}
      <View className="flex-row border-b" style={{ backgroundColor: colors.neutral[0], borderColor: colors.neutral[100] }}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className="flex-1 items-center py-3"
            activeOpacity={0.7}
          >
            <Text className="text-xs font-semibold" style={{ color: activeTab === tab ? colors.brand[700] : colors.neutral[400] }}>
              {tab}
            </Text>
            {activeTab === tab && (
              <View className="absolute bottom-0 rounded-t-sm" style={{ left: '16%', right: '16%', height: 2, backgroundColor: colors.brand[700] }} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      {activeTab === 'QR 스캔' && (
        <QRScanTab onScan={() => (navigation as any).navigate('QRScanner', { storeId: '1' })} />
      )}
      {activeTab === '근태 관리' && <AttendanceTab />}
      {activeTab === '추가 근무' && <ExtraWorkTab />}
    </View>
  );
}
