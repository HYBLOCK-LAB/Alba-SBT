import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { colors } from '../../constants/theme';
import { getMyMonthlyAttendance, type MonthlyAttendanceSummary } from '../../services/attendanceService';
import {
  getExtraWorkRequests, getMyExtraWorkApplications, applyExtraWork,
  type ExtraWorkRequest, type ExtraWorkApplication,
} from '../../services/extraWorkService';
import type { WorkerScreenProps } from '../../navigation/types';

const TABS = ['QR 스캔', '근태 관리', '추가 근무'] as const;
type Tab = typeof TABS[number];

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

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

function buildCalendarRows(year: number, month: number) {
  const firstDow = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: { day: number | null; dow: number }[] = [];
  for (let i = 0; i < firstDow; i++) cells.push({ day: null, dow: i });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, dow: (firstDow + d - 1) % 7 });
  while (cells.length % 7 !== 0) cells.push({ day: null, dow: cells.length % 7 });
  const rows: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

// ── QR 스캔 탭 ────────────────────────────────────────────────────────────────
function QRScanTab({ onScan }: { onScan: () => void }) {
  return (
    <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
      <TouchableOpacity
        onPress={onScan}
        activeOpacity={0.85}
        className="flex-row items-center justify-center gap-3 py-5 rounded-2xl mb-3"
        style={{ backgroundColor: colors.brand[700], shadowColor: colors.brand[700], shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 }}
      >
        <View style={{ width: 22, height: 22, borderWidth: 2, borderColor: '#fff', borderRadius: 4 }} />
        <Text className="text-base font-bold text-white">QR 스캔으로 출퇴근하기</Text>
      </TouchableOpacity>
      <Text className="text-xs text-center leading-relaxed" style={{ color: colors.neutral[400] }}>
        GPS 위치가 매장 반경 내에 있어야 합니다
      </Text>
    </ScrollView>
  );
}

// ── 근태 관리 탭 ──────────────────────────────────────────────────────────────
function AttendanceTab() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [summary, setSummary] = useState<MonthlyAttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getMyMonthlyAttendance(year, month)
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [year, month]);

  const rows = buildCalendarRows(year, month);
  const today = now.getDate();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const attendedDays = new Set(
    summary?.records.filter(r => r.status !== 'absent' && r.clock_in_time).map(r => new Date(r.clock_in_time).getDate()) ?? []
  );
  const absentDays = new Set(
    summary?.records.filter(r => r.status === 'absent').map(r => new Date(r.clock_in_time).getDate()) ?? []
  );

  const todayRecord = summary?.records.find(r => {
    if (!r.clock_in_time) return false;
    const d = new Date(r.clock_in_time);
    return d.getDate() === today && d.getMonth() + 1 === month;
  });

  const prevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1); };

  if (loading) return <View className="flex-1 items-center justify-center"><ActivityIndicator color={colors.brand[600]} /></View>;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View className="flex-row mx-4 mt-4 rounded-2xl overflow-hidden" style={{ backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[100] }}>
        {[
          { label: '출근일', value: String(summary?.total_days ?? 0), color: colors.brand[700] },
          { label: '지각', value: String(summary?.late_count ?? 0), color: colors.amber[500] },
          { label: '결근', value: String(summary?.absent_count ?? 0), color: colors.neutral[700] },
        ].map((item, i) => (
          <View key={item.label} className="flex-1 items-center py-4" style={{ borderLeftWidth: i > 0 ? 1 : 0, borderColor: colors.neutral[100] }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: item.color }}>{item.value}</Text>
            <Text style={{ fontSize: 11, color: colors.neutral[400], marginTop: 2 }}>{item.label}</Text>
          </View>
        ))}
      </View>

      <View className="mx-4 mt-3 rounded-2xl p-4" style={{ backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[100] }}>
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity className="p-1" onPress={prevMonth}>
            <View style={{ width: 8, height: 8, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: colors.neutral[400], transform: [{ rotate: '45deg' }] }} />
          </TouchableOpacity>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.neutral[800] }}>{year}년 {month}월</Text>
          <TouchableOpacity className="p-1" onPress={nextMonth}>
            <View style={{ width: 8, height: 8, borderRightWidth: 2, borderTopWidth: 2, borderColor: colors.neutral[400], transform: [{ rotate: '45deg' }] }} />
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
              const isToday = isCurrentMonth && cell.day === today;
              const attended = attendedDays.has(cell.day);
              const absent = absentDays.has(cell.day);
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

      {isCurrentMonth && (
        <View className="mx-4 mt-3 mb-6 rounded-2xl p-4" style={{ backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[100] }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.neutral[500], marginBottom: 10 }}>오늘 근무</Text>
          {todayRecord ? (
            <View className="flex-row justify-between items-end">
              <View className="gap-0.5">
                <Text style={{ fontSize: 10, color: colors.neutral[400] }}>출근시간</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.neutral[800] }}>{formatTime(todayRecord.clock_in_time)}</Text>
              </View>
              <View className="items-end gap-0.5">
                <Text style={{ fontSize: 10, color: colors.neutral[400] }}>{todayRecord.clock_out_time ? '퇴근시간' : '근무중'}</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: todayRecord.clock_out_time ? colors.neutral[800] : colors.brand[600] }}>
                  {todayRecord.clock_out_time ? formatTime(todayRecord.clock_out_time) : '진행 중'}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={{ fontSize: 13, color: colors.neutral[400], textAlign: 'center', paddingVertical: 8 }}>오늘 출근 기록이 없습니다</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

// ── 추가 근무 탭 ──────────────────────────────────────────────────────────────
function ExtraWorkTab({ storeId }: { storeId: string }) {
  const [requests, setRequests] = useState<ExtraWorkRequest[]>([]);
  const [applications, setApplications] = useState<ExtraWorkApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getExtraWorkRequests(storeId).catch(() => []),
      getMyExtraWorkApplications().catch(() => []),
    ]).then(([reqs, apps]) => {
      setRequests(reqs);
      setApplications(apps);
    }).finally(() => setLoading(false));
  }, [storeId]);

  const appliedIds = new Set(applications.map(a => a.extra_work_request_id));
  const available = requests.filter(r => !appliedIds.has(r.id));
  const applied = requests.filter(r => appliedIds.has(r.id));

  const handleApply = async (requestId: string) => {
    setApplying(requestId);
    try {
      const app = await applyExtraWork(requestId);
      setApplications(prev => [...prev, app]);
    } catch (e: any) {
      Alert.alert('신청 실패', e?.message ?? '다시 시도해 주세요.');
    } finally {
      setApplying(null);
    }
  };

  function fmtDT(iso: string) {
    const d = new Date(iso);
    return `${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  if (loading) return <View className="flex-1 items-center justify-center"><ActivityIndicator color={colors.brand[600]} /></View>;

  return (
    <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
      <View className="px-4 pt-4 pb-2">
        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.neutral[500] }}>신청 가능 ({available.length})</Text>
      </View>
      {available.length === 0 ? (
        <View className="mx-4 mb-3 p-4 rounded-2xl items-center" style={{ backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[100] }}>
          <Text style={{ fontSize: 13, color: colors.neutral[400] }}>신청 가능한 추가 근무가 없습니다</Text>
        </View>
      ) : available.map(item => (
        <View key={item.id} className="mx-4 mb-2.5 rounded-2xl p-4" style={{ backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[100] }}>
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.neutral[900] }}>
                {fmtDT(item.start_time)} – {String(new Date(item.end_time).getHours()).padStart(2, '0')}:{String(new Date(item.end_time).getMinutes()).padStart(2, '0')}
              </Text>
              {item.description && <Text style={{ fontSize: 12, color: colors.neutral[500], marginTop: 2 }}>{item.description}</Text>}
            </View>
            <TouchableOpacity
              onPress={() => handleApply(item.id)}
              disabled={applying === item.id}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.brand[400] }}
            >
              {applying === item.id
                ? <ActivityIndicator size="small" color={colors.brand[600]} />
                : <Text style={{ fontSize: 12, fontWeight: '700', color: colors.brand[700] }}>신청하기</Text>}
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <View style={{ height: 8, backgroundColor: colors.neutral[100], marginVertical: 4 }} />
      <View className="px-4 pt-4 pb-2">
        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.neutral[500] }}>신청 완료 ({applied.length})</Text>
      </View>
      {applied.map(item => (
        <View key={item.id} className="mx-4 mb-2.5 rounded-2xl p-4" style={{ backgroundColor: colors.neutral[50], borderWidth: 1, borderColor: colors.neutral[100], opacity: 0.75 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.neutral[500] }}>
            {fmtDT(item.start_time)} – {String(new Date(item.end_time).getHours()).padStart(2, '0')}:{String(new Date(item.end_time).getMinutes()).padStart(2, '0')}
          </Text>
          <View style={{ marginTop: 6, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: `${colors.brand[700]}15` }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: colors.brand[700] }}>신청 완료</Text>
          </View>
        </View>
      ))}
      <View className="h-8" />
    </ScrollView>
  );
}

// ── 메인 화면 ─────────────────────────────────────────────────────────────────
export default function StoreLandingScreen({ navigation, route }: WorkerScreenProps<'StoreLanding'>) {
  const { storeId } = route.params;
  const [activeTab, setActiveTab] = useState<Tab>('QR 스캔');

  return (
    <View className="flex-1" style={{ backgroundColor: colors.neutral[50] }}>
      <View className="flex-row items-center justify-between px-4 pt-14 pb-3 border-b" style={{ borderColor: colors.neutral[100], backgroundColor: colors.neutral[0] }}>
        <TouchableOpacity onPress={() => navigation.goBack()} className="flex-row items-center gap-2" activeOpacity={0.7}>
          <BackChevron />
          <Text className="text-base font-bold" style={{ color: colors.neutral[900] }}>내 매장</Text>
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

      <View className="flex-row border-b" style={{ backgroundColor: colors.neutral[0], borderColor: colors.neutral[100] }}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className="flex-1 items-center py-3"
            activeOpacity={0.7}
          >
            <Text className="text-xs font-semibold" style={{ color: activeTab === tab ? colors.brand[700] : colors.neutral[400] }}>{tab}</Text>
            {activeTab === tab && (
              <View className="absolute bottom-0 rounded-t-sm" style={{ left: '16%', right: '16%', height: 2, backgroundColor: colors.brand[700] }} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'QR 스캔' && (
        <QRScanTab onScan={() => (navigation as any).navigate('QRScanner', { storeId })} />
      )}
      {activeTab === '근태 관리' && <AttendanceTab />}
      {activeTab === '추가 근무' && <ExtraWorkTab storeId={storeId} />}
    </View>
  );
}
