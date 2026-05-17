import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { colors } from '../../constants/theme';
import type { ManagerScreenProps } from '../../navigation/types';

const TABS = ['인사 관리', '근태 관리', '추가 근무', 'QR 생성', '승급 승인'];

export default function ManagerExtraWorkScreen({ navigation }: ManagerScreenProps<'ManagerExtraWork'>) {
  const [showSheet, setShowSheet] = useState(false);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

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
              fontSize: 11, fontWeight: tab === '추가 근무' ? '700' : '600',
              color: tab === '추가 근무' ? colors.brand[700] : colors.neutral[400],
              flexShrink: 0,
            }}>{tab}</Text>
            {tab === '추가 근무' && (
              <View style={{ position: 'absolute', bottom: 0, left: 10, right: 10, height: 2, backgroundColor: colors.brand[700], borderRadius: 2 }} />
            )}
          </View>
        ))}
      </ScrollView>

      {/* 콘텐츠 */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* 헤더 행 */}
        <View className="flex-row items-center justify-between mb-3">
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.neutral[500], textTransform: 'uppercase', letterSpacing: 0.8 }}>등록한 추가 근무</Text>
          <TouchableOpacity onPress={() => setShowSheet(true)} className="px-3 py-1.5 rounded-lg" style={{ backgroundColor: colors.brand[700] }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#fff' }}>+ 등록</Text>
          </TouchableOpacity>
        </View>

        {/* 카드 1 - 신청 있음 */}
        <View className="rounded-2xl border p-4 mb-3" style={{ borderColor: colors.neutral[100] }}>
          <View className="flex-row items-start justify-between mb-3">
            <View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.neutral[900] }}>
                5월 10일 <Text style={{ fontSize: 12, fontWeight: '500', color: colors.neutral[400] }}>(토)</Text>
              </Text>
              <Text style={{ fontSize: 11, color: colors.neutral[400], marginTop: 2 }}>오전 10:00 – 오후 6:00</Text>
            </View>
            <View className="px-2 py-0.5 rounded border" style={{ borderColor: colors.brand[300] }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: colors.brand[700] }}>신청 2명</Text>
            </View>
          </View>
          <TouchableOpacity className="py-2.5 rounded-xl items-center" style={{ backgroundColor: colors.brand[700] }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>수락 처리</Text>
          </TouchableOpacity>
        </View>

        {/* 카드 2 - 신청 없음 */}
        <View className="rounded-2xl border p-4 mb-3" style={{ borderColor: colors.neutral[100], opacity: 0.65 }}>
          <View className="flex-row items-start justify-between mb-3">
            <View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.neutral[900] }}>
                5월 17일 <Text style={{ fontSize: 12, fontWeight: '500', color: colors.neutral[400] }}>(토)</Text>
              </Text>
              <Text style={{ fontSize: 11, color: colors.neutral[400], marginTop: 2 }}>오후 2:00 – 오후 8:00</Text>
            </View>
            <View className="px-2 py-0.5 rounded border" style={{ borderColor: colors.neutral[300] }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: colors.neutral[500] }}>신청 0명</Text>
            </View>
          </View>
          <View className="py-2.5 rounded-xl items-center" style={{ backgroundColor: colors.neutral[100] }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.neutral[400] }}>신청 없음</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sheet Modal */}
      <Modal visible={showSheet} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={() => setShowSheet(false)} />
          <View className="rounded-t-3xl p-5" style={{ backgroundColor: colors.neutral[0] }}>
            <View className="w-9 h-1 rounded-full self-center mb-4" style={{ backgroundColor: colors.neutral[300] }} />
            <Text className="text-base font-bold mb-4" style={{ color: colors.neutral[900] }}>추가 근무 등록</Text>
            <View className="mb-3">
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.neutral[500], marginBottom: 4 }}>날짜</Text>
              <TextInput
                value={date} onChangeText={setDate} placeholder="2026-05-24"
                placeholderTextColor={colors.neutral[300]}
                style={{ borderWidth: 1.5, borderColor: colors.neutral[200], borderRadius: 9, padding: 10, fontSize: 13, color: colors.neutral[900] }}
              />
            </View>
            <View className="flex-row gap-2 mb-4">
              <View className="flex-1">
                <Text style={{ fontSize: 11, fontWeight: '600', color: colors.neutral[500], marginBottom: 4 }}>시작 시간</Text>
                <TextInput value={startTime} onChangeText={setStartTime} placeholder="09:00"
                  placeholderTextColor={colors.neutral[300]}
                  style={{ borderWidth: 1.5, borderColor: colors.neutral[200], borderRadius: 9, padding: 10, fontSize: 13, color: colors.neutral[900] }} />
              </View>
              <View className="flex-1">
                <Text style={{ fontSize: 11, fontWeight: '600', color: colors.neutral[500], marginBottom: 4 }}>종료 시간</Text>
                <TextInput value={endTime} onChangeText={setEndTime} placeholder="18:00"
                  placeholderTextColor={colors.neutral[300]}
                  style={{ borderWidth: 1.5, borderColor: colors.neutral[200], borderRadius: 9, padding: 10, fontSize: 13, color: colors.neutral[900] }} />
              </View>
            </View>
            <TouchableOpacity className="py-3.5 rounded-2xl items-center mb-6" style={{ backgroundColor: colors.brand[700] }} onPress={() => setShowSheet(false)}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>등록하기</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
