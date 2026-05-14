import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../../constants/theme';
import type { WorkerTabScreenProps } from '../../navigation/types';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

// May 2026: starts on Friday (day index 5)
const MAY_START_DOW = 5;
const MAY_DAYS = 31;
const TODAY = 9;

// mock: attended days, absent days
const ATTENDED = new Set([1, 2, 5, 6, 7, 8, 9]);
const ABSENT = new Set([3]);

function InnerTabBar({ active }: { active: number }) {
  const tabs = ['QR 스캔', '근태 관리', '추가 근무'];
  return (
    <View className="flex-row border-b" style={{ borderColor: colors.neutral[100], backgroundColor: colors.neutral[0] }}>
      {tabs.map((t, i) => (
        <View key={t} className="flex-1 items-center pb-2.5 pt-2.5" style={{ position: 'relative' }}>
          <Text style={{
            fontSize: 12,
            fontWeight: i === active ? '700' : '500',
            color: i === active ? colors.brand[700] : colors.neutral[400],
          }}>{t}</Text>
          {i === active && (
            <View style={{
              position: 'absolute', bottom: 0, left: '16%', right: '16%',
              height: 2, backgroundColor: colors.brand[700], borderRadius: 2,
            }} />
          )}
        </View>
      ))}
    </View>
  );
}

function CalendarDay({ day, dow }: { day: number | null; dow: number }) {
  if (day === null) return <View className="flex-1 items-center py-1" />;
  const isToday = day === TODAY;
  const attended = ATTENDED.has(day);
  const absent = ABSENT.has(day);
  const isSun = dow === 0;
  const isSat = dow === 6;
  const textColor = isToday ? '#fff' : isSun ? colors.error : isSat ? colors.brand[500] : colors.neutral[800];

  return (
    <View className="flex-1 items-center py-1">
      <View style={{
        width: 26, height: 26, borderRadius: 13,
        backgroundColor: isToday ? colors.brand[700] : 'transparent',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 12, fontWeight: isToday ? '700' : '400', color: textColor }}>{day}</Text>
      </View>
      {attended && !isToday && (
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.brand[300], marginTop: 2 }} />
      )}
      {absent && (
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.error, marginTop: 2 }} />
      )}
      {!attended && !absent && <View style={{ width: 4, height: 4, marginTop: 2 }} />}
    </View>
  );
}

function buildCalendarRows() {
  const cells: { day: number | null; dow: number }[] = [];
  for (let i = 0; i < MAY_START_DOW; i++) cells.push({ day: null, dow: i });
  for (let d = 1; d <= MAY_DAYS; d++) cells.push({ day: d, dow: (MAY_START_DOW + d - 1) % 7 });
  while (cells.length % 7 !== 0) cells.push({ day: null, dow: cells.length % 7 });
  const rows: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

const MONTHS = ['2026년 3월', '2026년 4월', '2026년 5월'];

export default function WorkerAttendanceScreen({ navigation }: WorkerTabScreenProps<'WorkerAttendance'>) {
  const [monthIdx, setMonthIdx] = useState(2);
  const month = MONTHS[monthIdx];
  const rows = buildCalendarRows();

  return (
    <View className="flex-1" style={{ backgroundColor: colors.neutral[50] }}>
      {/* Top bar */}
      <View className="flex-row items-center px-5 pt-14 pb-3 border-b" style={{ backgroundColor: colors.neutral[0], borderColor: colors.neutral[100] }}>
        <Text className="flex-1 font-bold text-base" style={{ color: colors.neutral[900] }}>근태 관리</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Summary card */}
        <View className="flex-row mx-4 mt-4 rounded-2xl overflow-hidden" style={{ backgroundColor: colors.neutral[0] }}>
          {[
            { label: '출근일', value: '18', color: colors.brand[700] },
            { label: '지각', value: '1', color: colors.amber[500] },
            { label: '결근', value: '0', color: colors.neutral[700] },
          ].map((item, i) => (
            <View key={item.label} className="flex-1 items-center py-4" style={{
              borderLeftWidth: i > 0 ? 1 : 0,
              borderColor: colors.neutral[100],
            }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: item.color, fontFamily: 'Inter' }}>{item.value}</Text>
              <Text style={{ fontSize: 11, color: colors.neutral[400], marginTop: 2 }}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Calendar */}
        <View className="mx-4 mt-3 rounded-2xl p-4" style={{ backgroundColor: colors.neutral[0] }}>
          {/* Month nav */}
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity className="p-1" onPress={() => setMonthIdx(i => Math.max(0, i - 1))}>
              <View style={{ width: 8, height: 8, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: monthIdx === 0 ? colors.neutral[200] : colors.neutral[400], transform: [{ rotate: '45deg' }] }} />
            </TouchableOpacity>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.neutral[800] }}>{month}</Text>
            <TouchableOpacity className="p-1" onPress={() => setMonthIdx(i => Math.min(MONTHS.length - 1, i + 1))}>
              <View style={{ width: 8, height: 8, borderRightWidth: 2, borderTopWidth: 2, borderColor: monthIdx === MONTHS.length - 1 ? colors.neutral[200] : colors.neutral[400], transform: [{ rotate: '45deg' }] }} />
            </TouchableOpacity>
          </View>
          {/* Day headers */}
          <View className="flex-row mb-1">
            {DAYS.map((d, i) => (
              <Text key={d} className="flex-1 text-center" style={{
                fontSize: 11, fontWeight: '600',
                color: i === 0 ? colors.error : i === 6 ? colors.brand[500] : colors.neutral[400],
              }}>{d}</Text>
            ))}
          </View>
          {/* Date rows */}
          {rows.map((row, ri) => (
            <View key={ri} className="flex-row">
              {row.map((cell, ci) => (
                <CalendarDay key={ci} day={cell.day} dow={cell.dow} />
              ))}
            </View>
          ))}
        </View>

        {/* Today work status */}
        <View className="mx-4 mt-3 mb-6 rounded-2xl p-4" style={{ backgroundColor: colors.neutral[0] }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.neutral[500], marginBottom: 10 }}>오늘 근무</Text>
          <View className="flex-row justify-between items-end mb-3">
            <View className="gap-0.5">
              <Text style={{ fontSize: 10, color: colors.neutral[400] }}>출근시간</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.neutral[800] }}>09:03</Text>
            </View>
            <View className="items-center">
              <Text style={{ fontSize: 22, fontWeight: '800', color: colors.brand[700], fontFamily: 'Inter', lineHeight: 26 }}>7:12</Text>
              <Text style={{ fontSize: 10, color: colors.neutral[400] }}>잔여</Text>
            </View>
            <View className="items-end gap-0.5">
              <Text style={{ fontSize: 10, color: colors.neutral[400] }}>퇴근예정</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.neutral[800] }}>18:00</Text>
            </View>
          </View>
          {/* Progress */}
          <View style={{ height: 4, backgroundColor: colors.neutral[200], borderRadius: 99 }}>
            <View style={{ height: 4, width: '2%', backgroundColor: colors.brand[500], borderRadius: 99 }} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
