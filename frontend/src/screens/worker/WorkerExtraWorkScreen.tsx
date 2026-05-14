import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../../constants/theme';
import type { WorkerTabScreenProps } from '../../navigation/types';

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

interface ExtraItem {
  id: string;
  date: string;
  time: string;
  status: 'available' | 'applied';
}

const AVAILABLE: ExtraItem[] = [
  { id: '1', date: '5월 8일 (금)', time: '13:00 – 18:00', status: 'available' },
  { id: '2', date: '5월 12일 (화)', time: '09:00 – 14:00', status: 'available' },
];

const APPLIED: ExtraItem[] = [
  { id: '3', date: '5월 3일 (토)', time: '10:00 – 15:00', status: 'applied' },
];

export default function WorkerExtraWorkScreen({ navigation }: WorkerTabScreenProps<'WorkerExtraWork'>) {
  const [applied, setApplied] = useState<Set<string>>(new Set());

  const handleApply = (id: string) => setApplied(prev => new Set([...prev, id]));
  const handleCancel = (id: string) => setApplied(prev => { const s = new Set(prev); s.delete(id); return s; });

  return (
    <View className="flex-1" style={{ backgroundColor: colors.neutral[50] }}>
      {/* Top bar */}
      <View className="flex-row items-center px-5 pt-14 pb-3 border-b" style={{ backgroundColor: colors.neutral[0], borderColor: colors.neutral[100] }}>
        <Text className="flex-1 font-bold text-base" style={{ color: colors.neutral[900] }}>추가 근무</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Available section */}
        <View className="px-4 pt-4 pb-2">
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.neutral[500] }}>신청 가능</Text>
        </View>

        {AVAILABLE.map(item => {
          const isApplied = applied.has(item.id);
          return (
            <View
              key={item.id}
              className="mx-4 mb-2.5 rounded-2xl p-4"
              style={{ backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[100] }}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text style={{ fontSize: 16, fontWeight: '700', color: isApplied ? colors.neutral[400] : colors.neutral[900] }}>
                    {item.date}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.neutral[500], marginTop: 2 }}>{item.time}</Text>
                  {isApplied && (
                    <View style={{
                      marginTop: 6, alignSelf: 'flex-start',
                      paddingHorizontal: 8, paddingVertical: 3,
                      borderRadius: 20, backgroundColor: `${colors.brand[700]}15`,
                    }}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: colors.brand[700] }}>신청 완료</Text>
                    </View>
                  )}
                </View>
                {!isApplied ? (
                  <TouchableOpacity
                    onPress={() => handleApply(item.id)}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 8,
                      borderRadius: 10, borderWidth: 1, borderColor: colors.brand[400],
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.brand[700] }}>신청하기</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => handleCancel(item.id)}>
                    <Text style={{ fontSize: 12, fontWeight: '500', color: colors.neutral[400] }}>취소</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        {/* Divider */}
        <View style={{ height: 8, backgroundColor: colors.neutral[100], marginVertical: 4 }} />

        {/* Applied section */}
        <View className="px-4 pt-4 pb-2">
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.neutral[500] }}>신청 완료</Text>
        </View>

        {APPLIED.map(item => (
          <View
            key={item.id}
            className="mx-4 mb-2.5 rounded-2xl p-4"
            style={{ backgroundColor: colors.neutral[50], borderWidth: 1, borderColor: colors.neutral[100], opacity: 0.75 }}
          >
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.neutral[500] }}>{item.date}</Text>
                <Text style={{ fontSize: 12, color: colors.neutral[400], marginTop: 2 }}>{item.time}</Text>
              </View>
              <View className="items-end gap-1.5">
                <View style={{
                  paddingHorizontal: 8, paddingVertical: 3,
                  borderRadius: 20, backgroundColor: `${colors.brand[700]}15`,
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: colors.brand[700] }}>신청 완료</Text>
                </View>
                <TouchableOpacity onPress={() => handleCancel(item.id)}>
                  <Text style={{ fontSize: 12, fontWeight: '500', color: colors.neutral[400] }}>취소</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
