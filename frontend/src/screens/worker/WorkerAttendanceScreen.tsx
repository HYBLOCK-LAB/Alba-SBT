import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { colors } from '../../constants/theme';
import { getMyMonthlyAttendance, type MonthlyAttendanceSummary } from '../../services/attendanceService';
import type { WorkerTabScreenProps } from '../../navigation/types';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

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

function CalendarDay({
  day, dow, attended, absent, isToday,
}: { day: number | null; dow: number; attended: boolean; absent: boolean; isToday: boolean }) {
  if (day === null) return <View className="flex-1 items-center py-1" />;
  const textColor = isToday ? '#fff' : dow === 0 ? colors.error : dow === 6 ? colors.brand[500] : colors.neutral[800];
  return (
    <View className="flex-1 items-center py-1">
      <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: isToday ? colors.brand[700] : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 12, fontWeight: isToday ? '700' : '400', color: textColor }}>{day}</Text>
      </View>
      {attended && !isToday && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.brand[300], marginTop: 2 }} />}
      {absent && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.error, marginTop: 2 }} />}
      {!attended && !absent && <View style={{ width: 4, height: 4, marginTop: 2 }} />}
    </View>
  );
}

export default function WorkerAttendanceScreen({ navigation }: WorkerTabScreenProps<'WorkerAttendance'>) {
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
    summary?.records
      .filter(r => r.status !== 'absent' && r.clock_in_time)
      .map(r => new Date(r.clock_in_time).getDate()) ?? []
  );
  const absentDays = new Set(
    summary?.records
      .filter(r => r.status === 'absent')
      .map(r => new Date(r.clock_in_time).getDate()) ?? []
  );

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const todayRecord = summary?.records.find(r => {
    if (!r.clock_in_time) return false;
    const d = new Date(r.clock_in_time);
    return d.getDate() === today && d.getMonth() + 1 === month;
  });

  return (
    <View className="flex-1" style={{ backgroundColor: colors.neutral[50] }}>
      <View className="flex-row items-center px-5 pt-14 pb-3 border-b" style={{ backgroundColor: colors.neutral[0], borderColor: colors.neutral[100] }}>
        <Text className="flex-1 font-bold text-base" style={{ color: colors.neutral[900] }}>근태 관리</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand[600]} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* 요약 */}
          <View className="flex-row mx-4 mt-4 rounded-2xl overflow-hidden" style={{ backgroundColor: colors.neutral[0] }}>
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

          {/* 달력 */}
          <View className="mx-4 mt-3 rounded-2xl p-4" style={{ backgroundColor: colors.neutral[0] }}>
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
                {row.map((cell, ci) => (
                  <CalendarDay
                    key={ci}
                    day={cell.day}
                    dow={cell.dow}
                    attended={cell.day !== null && attendedDays.has(cell.day)}
                    absent={cell.day !== null && absentDays.has(cell.day)}
                    isToday={isCurrentMonth && cell.day === today}
                  />
                ))}
              </View>
            ))}
          </View>

          {/* 오늘 근무 */}
          {isCurrentMonth && (
            <View className="mx-4 mt-3 mb-6 rounded-2xl p-4" style={{ backgroundColor: colors.neutral[0] }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.neutral[500], marginBottom: 10 }}>오늘 근무</Text>
              {todayRecord ? (
                <View className="flex-row justify-between items-end">
                  <View className="gap-0.5">
                    <Text style={{ fontSize: 10, color: colors.neutral[400] }}>출근시간</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.neutral[800] }}>
                      {new Date(todayRecord.clock_in_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <View className="items-end gap-0.5">
                    <Text style={{ fontSize: 10, color: colors.neutral[400] }}>
                      {todayRecord.clock_out_time ? '퇴근시간' : '근무중'}
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: todayRecord.clock_out_time ? colors.neutral[800] : colors.brand[600] }}>
                      {todayRecord.clock_out_time
                        ? new Date(todayRecord.clock_out_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                        : '진행 중'}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={{ fontSize: 13, color: colors.neutral[400], textAlign: 'center', paddingVertical: 8 }}>
                  오늘 출근 기록이 없습니다
                </Text>
              )}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
