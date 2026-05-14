import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  Modal, TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { colors } from '../../constants/theme';
import type { ManagerScreenProps } from '../../navigation/types';

const STORE_TABS = ['인사 관리', '근태 관리', '추가 근무', 'QR 생성', '승급 승인'] as const;
type StoreTab = typeof STORE_TABS[number];

// ── 공통 ──────────────────────────────────────────────────────────────────────

function BackChevron() {
  return (
    <View style={{ width: 18, height: 18, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: 9, height: 9, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: colors.neutral[600], transform: [{ rotate: '45deg' }] }} />
    </View>
  );
}

function Avatar({ brand = true }: { brand?: boolean }) {
  return (
    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: brand ? colors.brand[50] : colors.neutral[100], alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 13, height: 13 }}>
        <View style={{ position: 'absolute', top: 0, left: 2, width: 9, height: 9, borderRadius: 4.5, borderWidth: 1.5, borderColor: brand ? colors.brand[600] : colors.neutral[500] }} />
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 5, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderWidth: 1.5, borderColor: brand ? colors.brand[600] : colors.neutral[500] }} />
      </View>
    </View>
  );
}

function LevelBadge({ level, active }: { level: string; active?: boolean }) {
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1, borderColor: active ? colors.brand[300] : colors.neutral[300] }}>
      <Text style={{ fontSize: 10, fontWeight: '600', color: active ? colors.brand[700] : colors.neutral[500] }}>{level}</Text>
    </View>
  );
}

function ChevronRight() {
  return (
    <View style={{ width: 13, height: 13, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 5, height: 5, borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: colors.neutral[300], transform: [{ rotate: '45deg' }] }} />
    </View>
  );
}

// ── 인사 관리 탭 ─────────────────────────────────────────────────────────────

function HRTab({ onWorkerPress }: { onWorkerPress: (userId: string) => void }) {
  const staff = [
    { id: 'u1', name: '홍길동', sub: '등록 2024.03.01 · 142일', level: 'Lv.2', active: true },
    { id: 'u2', name: '김민지', sub: '등록 2025.01.15 · 88일', level: 'Lv.1', active: false },
    { id: 'u3', name: '박성실', sub: '등록 2025.09.01 · 45일', level: 'Lv.1', active: false },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.neutral[500], textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
        재직 중 <Text style={{ color: colors.neutral[400], fontWeight: '500' }}>3명</Text>
      </Text>
      <View style={{ borderRadius: 12, borderWidth: 1.5, borderColor: colors.neutral[100], overflow: 'hidden', marginBottom: 14 }}>
        {staff.map((s, i) => (
          <TouchableOpacity key={s.name} onPress={() => onWorkerPress(s.id)} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: i < staff.length - 1 ? 1 : 0, borderColor: colors.neutral[100] }}>
            <Avatar />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.neutral[900] }}>{s.name}</Text>
              <Text style={{ fontSize: 10, color: colors.neutral[400], marginTop: 1 }}>{s.sub}</Text>
            </View>
            <LevelBadge level={s.level} active={s.active} />
            <ChevronRight />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.neutral[500], textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
        승인 대기 <Text style={{ color: colors.neutral[400], fontWeight: '500' }}>1명</Text>
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: colors.neutral[200], marginBottom: 16 }}>
        <Avatar brand={false} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.neutral[900] }}>이지원</Text>
          <Text style={{ fontSize: 10, color: colors.neutral[400], marginTop: 1 }}>2026.05.04 연결 요청</Text>
        </View>
        <TouchableOpacity onPress={() => Alert.alert('승인', '이지원님을 승인하시겠습니까?')} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 7, backgroundColor: colors.brand[700] }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: '#fff' }}>승인</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Alert.alert('거절', '이지원님을 거절하시겠습니까?')} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 7, borderWidth: 1.5, borderColor: colors.neutral[200] }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: colors.neutral[400] }}>거절</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.neutral[50] }}>
        <View>
          <Text style={{ fontSize: 10, fontWeight: '600', color: colors.neutral[400], textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>매장 코드</Text>
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.neutral[900], letterSpacing: 3 }}>A3K9F2</Text>
        </View>
        <TouchableOpacity
          onPress={async () => { await Clipboard.setStringAsync('A3K9F2'); Alert.alert('복사 완료', '매장 코드가 클립보드에 복사되었습니다.'); }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: colors.brand[200] }}
        >
          <Text style={{ fontSize: 11, fontWeight: '600', color: colors.brand[700] }}>복사</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ── 근태 관리 탭 ─────────────────────────────────────────────────────────────

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const MAY_START = 4;
const MAY_DAYS = 31;
const TODAY_DAY = 9;
type DotType = 'attend' | 'absent' | 'none';
const DOT_MAP: Record<number, DotType> = { 1: 'attend', 2: 'attend', 5: 'attend', 6: 'attend', 7: 'attend', 8: 'attend', 20: 'absent' };

function AttendanceTab() {
  const cells: { day: number | null; isToday: boolean; dot: DotType; isSun: boolean; isSat: boolean }[] = [];
  for (let i = 0; i < MAY_START; i++) cells.push({ day: null, isToday: false, dot: 'none', isSun: false, isSat: false });
  for (let d = 1; d <= MAY_DAYS; d++) {
    const col = (MAY_START + d - 1) % 7;
    cells.push({ day: d, isToday: d === TODAY_DAY, dot: DOT_MAP[d] ?? 'none', isSun: col === 0, isSat: col === 6 });
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 14, paddingBottom: 40 }}>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        {[{ value: '87', unit: '%', label: '출근율' }, { value: '3', unit: '회', label: '지각' }, { value: '2', unit: '회', label: '결근' }].map(s => (
          <View key={s.label} style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: colors.neutral[100] }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.neutral[900] }}>
              {s.value}<Text style={{ fontSize: 12, fontWeight: '500' }}>{s.unit}</Text>
            </Text>
            <Text style={{ fontSize: 10, color: colors.neutral[400], marginTop: 2 }}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={{ borderRadius: 14, borderWidth: 1.5, borderColor: colors.neutral[100], padding: 14, marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <View style={{ width: 7, height: 7, borderLeftWidth: 1.5, borderBottomWidth: 1.5, borderColor: colors.neutral[400], transform: [{ rotate: '45deg' }] }} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.neutral[900] }}>2026년 5월</Text>
          <View style={{ width: 7, height: 7, borderRightWidth: 1.5, borderTopWidth: 1.5, borderColor: colors.neutral[400], transform: [{ rotate: '45deg' }] }} />
        </View>
        <View style={{ flexDirection: 'row', marginBottom: 4 }}>
          {DAYS.map((d, i) => (
            <Text key={d} style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '600', color: i === 0 ? colors.error : i === 6 ? '#3b82f6' : colors.neutral[400] }}>{d}</Text>
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {cells.map((cell, idx) => (
            <View key={idx} style={{ width: `${100 / 7}%` as any, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' }}>
              {cell.day !== null && (
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: cell.isToday ? colors.brand[700] : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: cell.isToday ? '700' : '500', color: cell.isToday ? '#fff' : cell.isSun ? colors.error : cell.isSat ? '#3b82f6' : colors.neutral[700] }}>{cell.day}</Text>
                  {cell.dot !== 'none' && !cell.isToday && (
                    <View style={{ position: 'absolute', bottom: 1, width: 3, height: 3, borderRadius: 1.5, backgroundColor: cell.dot === 'attend' ? colors.brand[300] : colors.error }} />
                  )}
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.neutral[500], textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>금일 출근 현황</Text>
      <View style={{ borderRadius: 12, borderWidth: 1.5, borderColor: colors.neutral[100], paddingHorizontal: 14 }}>
        {[
          { name: '홍길동', time: '09:02 출근', badge: '출근', bColor: '#15803d', bBorder: '#86efac' },
          { name: '김민지', time: '—', badge: '결근', bColor: colors.neutral[500], bBorder: colors.neutral[300] },
          { name: '박성실', time: '09:15 출근', badge: '지각', bColor: '#92400e', bBorder: '#fcd34d' },
        ].map((row, i) => (
          <View key={row.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: i < 2 ? 1 : 0, borderColor: colors.neutral[100] }}>
            <Text style={{ width: 52, fontSize: 13, fontWeight: '600', color: colors.neutral[900] }}>{row.name}</Text>
            <Text style={{ flex: 1, fontSize: 11, color: colors.neutral[500] }}>{row.time}</Text>
            <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1, borderColor: row.bBorder }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: row.bColor }}>{row.badge}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ── 추가 근무 탭 ─────────────────────────────────────────────────────────────

function ExtraWorkTab() {
  const [showSheet, setShowSheet] = useState(false);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  return (
    <View style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.neutral[500], textTransform: 'uppercase', letterSpacing: 0.8 }}>등록한 추가 근무</Text>
          <TouchableOpacity onPress={() => setShowSheet(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 7, backgroundColor: colors.brand[700] }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#fff' }}>+ 등록</Text>
          </TouchableOpacity>
        </View>

        <View style={{ borderRadius: 14, borderWidth: 1.5, borderColor: colors.neutral[100], padding: 14, marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
            <View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.neutral[900] }}>5월 10일 <Text style={{ fontSize: 12, fontWeight: '500', color: colors.neutral[400] }}>(토)</Text></Text>
              <Text style={{ fontSize: 11, color: colors.neutral[400], marginTop: 2 }}>오전 10:00 – 오후 6:00</Text>
            </View>
            <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1, borderColor: colors.brand[300] }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: colors.brand[700] }}>신청 2명</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => Alert.alert('수락 처리', '신청 인원을 수락하시겠습니까?')} style={{ paddingVertical: 10, borderRadius: 9, alignItems: 'center', backgroundColor: colors.brand[700] }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>수락 처리</Text>
          </TouchableOpacity>
        </View>

        <View style={{ borderRadius: 14, borderWidth: 1.5, borderColor: colors.neutral[100], padding: 14, opacity: 0.65 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
            <View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.neutral[900] }}>5월 17일 <Text style={{ fontSize: 12, fontWeight: '500', color: colors.neutral[400] }}>(토)</Text></Text>
              <Text style={{ fontSize: 11, color: colors.neutral[400], marginTop: 2 }}>오후 2:00 – 오후 8:00</Text>
            </View>
            <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1, borderColor: colors.neutral[300] }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: colors.neutral[500] }}>신청 0명</Text>
            </View>
          </View>
          <View style={{ paddingVertical: 10, borderRadius: 9, alignItems: 'center', backgroundColor: colors.neutral[100] }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.neutral[400] }}>신청 없음</Text>
          </View>
        </View>
      </ScrollView>

      <Modal visible={showSheet} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={() => setShowSheet(false)} />
          <View style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, backgroundColor: colors.neutral[0] }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.neutral[300], alignSelf: 'center', marginBottom: 14 }} />
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.neutral[900], marginBottom: 14 }}>추가 근무 등록</Text>
            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.neutral[500], marginBottom: 4 }}>날짜</Text>
              <TextInput value={date} onChangeText={setDate} placeholder="2026-05-24" placeholderTextColor={colors.neutral[300]} style={{ borderWidth: 1.5, borderColor: colors.neutral[200], borderRadius: 9, padding: 10, fontSize: 13, color: colors.neutral[900] }} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: colors.neutral[500], marginBottom: 4 }}>시작 시간</Text>
                <TextInput value={startTime} onChangeText={setStartTime} placeholder="09:00" placeholderTextColor={colors.neutral[300]} style={{ borderWidth: 1.5, borderColor: colors.neutral[200], borderRadius: 9, padding: 10, fontSize: 13, color: colors.neutral[900] }} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: colors.neutral[500], marginBottom: 4 }}>종료 시간</Text>
                <TextInput value={endTime} onChangeText={setEndTime} placeholder="18:00" placeholderTextColor={colors.neutral[300]} style={{ borderWidth: 1.5, borderColor: colors.neutral[200], borderRadius: 9, padding: 10, fontSize: 13, color: colors.neutral[900] }} />
              </View>
            </View>
            <TouchableOpacity style={{ paddingVertical: 14, borderRadius: 16, alignItems: 'center', marginBottom: 24, backgroundColor: colors.brand[700] }} onPress={() => { setShowSheet(false); setDate(''); setStartTime(''); setEndTime(''); }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>등록하기</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ── QR 생성 탭 ───────────────────────────────────────────────────────────────

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

function QRTab() {
  const [timer, setTimer] = useState(30);
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!active) return;
    if (timer === 0) { setActive(false); return; }
    const id = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer, active]);

  const handleRegenerate = () => { setTimer(30); setActive(true); };
  const cellSize = 8;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, alignItems: 'center' }}>
      <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', width: '100%', borderWidth: 1.5, borderColor: colors.neutral[100], marginBottom: 16 }}>
        <View style={{ width: cellSize * 14 + 16, height: cellSize * 14 + 16, padding: 8, backgroundColor: '#fff', position: 'relative' }}>
          {QR_PATTERN.map((row, r) => (
            <View key={r} style={{ flexDirection: 'row' }}>
              {row.map((cell, c) => (
                <View key={c} style={{ width: cellSize, height: cellSize, backgroundColor: cell ? '#111827' : 'transparent', borderRadius: 1 }} />
              ))}
            </View>
          ))}
          <View style={{ position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -14 }, { translateY: -14 }], width: 28, height: 28, borderRadius: 14, backgroundColor: colors.brand[700], alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: colors.brand[400] }} />
          </View>
        </View>

        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.neutral[500], marginTop: 14, letterSpacing: 2 }}>A3K9F2</Text>

        {active ? (
          <>
            <Text style={{ fontSize: 52, fontWeight: '800', color: colors.brand[700], lineHeight: 64, marginTop: 8 }}>{String(timer).padStart(2, '0')}</Text>
            <Text style={{ fontSize: 13, color: colors.neutral[400] }}>초 후 만료</Text>
          </>
        ) : (
          <>
            <Text style={{ fontSize: 32, fontWeight: '800', color: colors.neutral[300], marginTop: 8 }}>만료됨</Text>
            <Text style={{ fontSize: 13, color: colors.neutral[400] }}>재생성 버튼을 눌러주세요</Text>
          </>
        )}
      </View>

      <TouchableOpacity onPress={handleRegenerate} style={{ width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1.5, borderColor: colors.brand[300], marginBottom: 14 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.brand[700] }}>QR 재생성</Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 12, color: colors.neutral[400], textAlign: 'center', lineHeight: 18 }}>QR은 30초간 유효합니다.{'\n'}직원이 앱에서 스캔하면 출퇴근이 기록됩니다.</Text>
    </ScrollView>
  );
}

// ── 승급 승인 탭 ─────────────────────────────────────────────────────────────

const CONDITIONS = [
  { label: '6개월 근속 달성', met: true },
  { label: '성실 인증 (90일 연속)', met: true },
  { label: '완근 인증 달성', met: true },
  { label: '추가 근무 10회', met: false },
];

function LevelUpTab() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.neutral[500], textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
        승인 대기 <Text style={{ color: colors.neutral[400], fontWeight: '500' }}>1명</Text>
      </Text>

      <View style={{ borderRadius: 16, borderWidth: 1.5, borderColor: colors.neutral[200], padding: 16, marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Avatar />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.neutral[900] }}>홍길동</Text>
            <Text style={{ fontSize: 11, color: colors.neutral[400], marginTop: 1 }}>Lv.2 → Lv.3 승급 요청</Text>
          </View>
          <Text style={{ fontSize: 10, color: colors.neutral[400] }}>2026.05.08</Text>
        </View>

        <View style={{ gap: 10, marginBottom: 14 }}>
          {CONDITIONS.map((c) => (
            <View key={c.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: c.met ? colors.success : colors.neutral[200], alignItems: 'center', justifyContent: 'center' }}>
                {c.met ? (
                  <View style={{ width: 6, height: 9, borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: '#fff', transform: [{ rotate: '45deg' }, { translateY: -1 }] }} />
                ) : (
                  <View style={{ width: 8, height: 1.5, backgroundColor: colors.neutral[400], borderRadius: 1 }} />
                )}
              </View>
              <Text style={{ fontSize: 13, color: c.met ? colors.neutral[700] : colors.neutral[400] }}>{c.label}</Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', borderRadius: 10, borderWidth: 1.5, borderColor: colors.neutral[200], overflow: 'hidden', marginBottom: 14 }}>
          <View style={{ width: 3, backgroundColor: colors.warning }} />
          <View style={{ flex: 1, padding: 12 }}>
            <Text style={{ fontSize: 11, color: colors.neutral[600], lineHeight: 17 }}>추가 근무 10회 조건 미달 상태에서 승인 시 해당 EAS는 미발급됩니다.</Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => Alert.alert('서명 후 승인', '블록체인에 영구 기록됩니다. 승인하시겠습니까?', [{ text: '취소', style: 'cancel' }, { text: '승인', style: 'destructive', onPress: () => {} }])} style={{ paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: colors.brand[700] }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>서명 후 승인</Text>
        </TouchableOpacity>
      </View>

      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.neutral[400], textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>완료된 승급 내역</Text>
      <View style={{ padding: 14, borderRadius: 12, backgroundColor: colors.neutral[50] }}>
        <Text style={{ fontSize: 12, color: colors.neutral[400], paddingVertical: 4, borderBottomWidth: 1, borderColor: colors.neutral[100] }}>홍길동 · Lv.1 → Lv.2 · 2026.02.10</Text>
        <Text style={{ fontSize: 12, color: colors.neutral[400], paddingVertical: 4 }}>김민지 · Lv.1 → Lv.2 · 2026.04.12</Text>
      </View>
    </ScrollView>
  );
}

// ── 메인 화면 ─────────────────────────────────────────────────────────────────

export default function StoreManagementScreen({ navigation }: ManagerScreenProps<'StoreManagement'>) {
  const [activeTab, setActiveTab] = useState<StoreTab>('인사 관리');

  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral[0] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12, borderBottomWidth: 1, borderColor: colors.neutral[100] }}>
        <TouchableOpacity onPress={() => navigation.goBack()}><BackChevron /></TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: colors.neutral[900] }}>맥도날드 신촌점</Text>
      </View>

      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: colors.neutral[100] }}>
        {STORE_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 11, position: 'relative' }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 10, fontWeight: '600', color: activeTab === tab ? colors.brand[700] : colors.neutral[400] }}>{tab}</Text>
            {activeTab === tab && (
              <View style={{ position: 'absolute', bottom: 0, left: '10%', right: '10%', height: 2, backgroundColor: colors.brand[700], borderRadius: 2 }} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === '인사 관리' && <HRTab onWorkerPress={(userId) => navigation.navigate('CareerReport', { userId })} />}
      {activeTab === '근태 관리' && <AttendanceTab />}
      {activeTab === '추가 근무' && <ExtraWorkTab />}
      {activeTab === 'QR 생성' && <QRTab />}
      {activeTab === '승급 승인' && <LevelUpTab />}
    </View>
  );
}
