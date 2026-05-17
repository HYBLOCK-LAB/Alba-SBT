import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  Modal, TextInput, KeyboardAvoidingView, Platform,
  Alert, ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { colors } from '../../constants/theme';
import {
  getStaffByStore, approveStaffAssignment,
  type StaffAssignment,
} from '../../services/storeService';
import { getStoreTodayStatus, type StoreTodayStatus } from '../../services/attendanceService';
import {
  getExtraWorkRequests, createExtraWorkRequest,
  getStoreExtraWorkApplications, acceptExtraWorkApplication,
  type ExtraWorkRequest, type ExtraWorkApplication,
} from '../../services/extraWorkService';
import { getPendingApprovals, getSigningPayload, signApproval, type PendingApproval } from '../../services/levelUpService';
import { createQrToken } from '../../services/qrService';
import { useAuthStore } from '../../store/authStore';
import { getWcClient } from '../../services/walletService';
import type { ManagerScreenProps } from '../../navigation/types';

const STORE_TABS = ['인사 관리', '근태 관리', '추가 근무', 'QR 생성', '승급 승인'] as const;
type StoreTab = typeof STORE_TABS[number];

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

// ── 인사 관리 탭 ─────────────────────────────────────────────────────────────

function HRTab({ storeId, storeCode, onWorkerPress }: { storeId: string; storeCode: string; onWorkerPress: (userId: string) => void }) {
  const [staff, setStaff] = useState<StaffAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getStaffByStore(storeId).then(setStaff).catch(() => {}).finally(() => setLoading(false));
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (assignmentId: string, approved: boolean) => {
    setApproving(assignmentId);
    try {
      await approveStaffAssignment(assignmentId, { approved });
      load();
    } catch (e: any) {
      Alert.alert('오류', e?.message ?? '처리에 실패했습니다.');
    } finally {
      setApproving(null);
    }
  };

  const active = staff.filter(s => s.status === 'active');
  const pending = staff.filter(s => s.status === 'pending');

  if (loading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.brand[600]} /></View>;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.neutral[500], textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
        재직 중 <Text style={{ color: colors.neutral[400], fontWeight: '500' }}>{active.length}명</Text>
      </Text>
      {active.length > 0 && (
        <View style={{ borderRadius: 12, borderWidth: 1.5, borderColor: colors.neutral[100], overflow: 'hidden', marginBottom: 14 }}>
          {active.map((s, i) => (
            <TouchableOpacity key={s.id} onPress={() => onWorkerPress(s.user_id)} activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: i < active.length - 1 ? 1 : 0, borderColor: colors.neutral[100] }}>
              <Avatar />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.neutral[900] }}>{s.user_id}</Text>
                <Text style={{ fontSize: 10, color: colors.neutral[400], marginTop: 1 }}>직번 {s.id.slice(0, 8)}</Text>
              </View>
              <View style={{ width: 7, height: 7, borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: colors.neutral[300], transform: [{ rotate: '45deg' }] }} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {pending.length > 0 && (
        <>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.neutral[500], textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
            승인 대기 <Text style={{ color: colors.neutral[400], fontWeight: '500' }}>{pending.length}명</Text>
          </Text>
          {pending.map(s => (
            <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: colors.neutral[200], marginBottom: 8 }}>
              <Avatar brand={false} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.neutral[900] }}>{s.user_id}</Text>
                <Text style={{ fontSize: 10, color: colors.neutral[400], marginTop: 1 }}>{new Date(s.created_at).toLocaleDateString('ko-KR')} 연결 요청</Text>
              </View>
              <TouchableOpacity onPress={() => handleApprove(s.id, true)} disabled={approving === s.id}
                style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 7, backgroundColor: colors.brand[700] }}>
                {approving === s.id ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ fontSize: 11, fontWeight: '600', color: '#fff' }}>승인</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleApprove(s.id, false)} disabled={approving === s.id}
                style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 7, borderWidth: 1.5, borderColor: colors.neutral[200] }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: colors.neutral[400] }}>거절</Text>
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.neutral[50], marginTop: 4 }}>
        <View>
          <Text style={{ fontSize: 10, fontWeight: '600', color: colors.neutral[400], textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>매장 코드</Text>
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.neutral[900], letterSpacing: 3 }}>{storeCode}</Text>
        </View>
        <TouchableOpacity
          onPress={async () => { await Clipboard.setStringAsync(storeCode); Alert.alert('복사 완료', '매장 코드가 클립보드에 복사되었습니다.'); }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: colors.brand[200] }}
        >
          <Text style={{ fontSize: 11, fontWeight: '600', color: colors.brand[700] }}>복사</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ── 근태 관리 탭 ─────────────────────────────────────────────────────────────

function AttendanceTab({ storeId }: { storeId: string }) {
  const [status, setStatus] = useState<StoreTodayStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStoreTodayStatus(storeId).then(setStatus).catch(() => {}).finally(() => setLoading(false));
  }, [storeId]);

  if (loading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.brand[600]} /></View>;

  const present = status?.present ?? [];
  const absent = status?.absent ?? [];
  const total = present.length + absent.length;
  const attendRate = total > 0 ? Math.round((present.length / total) * 100) : 0;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 14, paddingBottom: 40 }}>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        {[
          { value: `${attendRate}`, unit: '%', label: '출근율' },
          { value: `${present.length}`, unit: '명', label: '출근' },
          { value: `${absent.length}`, unit: '명', label: '결근' },
        ].map(s => (
          <View key={s.label} style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: colors.neutral[100] }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.neutral[900] }}>
              {s.value}<Text style={{ fontSize: 12, fontWeight: '500' }}>{s.unit}</Text>
            </Text>
            <Text style={{ fontSize: 10, color: colors.neutral[400], marginTop: 2 }}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.neutral[500], textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>금일 출근 현황</Text>
      <View style={{ borderRadius: 12, borderWidth: 1.5, borderColor: colors.neutral[100], paddingHorizontal: 14 }}>
        {present.map((p, i) => (
          <View key={p.user_id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: i < present.length - 1 || absent.length > 0 ? 1 : 0, borderColor: colors.neutral[100] }}>
            <Text style={{ width: 72, fontSize: 13, fontWeight: '600', color: colors.neutral[900] }}>{p.name}</Text>
            <Text style={{ flex: 1, fontSize: 11, color: colors.neutral[500] }}>
              {new Date(p.clock_in_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 출근
            </Text>
            <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1, borderColor: '#86efac' }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#15803d' }}>출근</Text>
            </View>
          </View>
        ))}
        {absent.map((a, i) => (
          <View key={a.user_id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: i < absent.length - 1 ? 1 : 0, borderColor: colors.neutral[100] }}>
            <Text style={{ width: 72, fontSize: 13, fontWeight: '600', color: colors.neutral[900] }}>{a.name}</Text>
            <Text style={{ flex: 1, fontSize: 11, color: colors.neutral[400] }}>—</Text>
            <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1, borderColor: colors.neutral[300] }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: colors.neutral[500] }}>결근</Text>
            </View>
          </View>
        ))}
        {total === 0 && (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: colors.neutral[400] }}>오늘 근무 기록이 없습니다</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ── 추가 근무 탭 ─────────────────────────────────────────────────────────────

function ExtraWorkTab({ storeId }: { storeId: string }) {
  const [requests, setRequests] = useState<ExtraWorkRequest[]>([]);
  const [applications, setApplications] = useState<Record<string, ExtraWorkApplication[]>>({});
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const reqs = await getExtraWorkRequests(storeId);
      setRequests(reqs);
      const appMap: Record<string, ExtraWorkApplication[]> = {};
      await Promise.all(reqs.map(async r => {
        const apps = await getStoreExtraWorkApplications(storeId).catch(() => []);
        appMap[r.id] = apps.filter(a => a.extra_work_request_id === r.id);
      }));
      setApplications(appMap);
    } catch {}
    setLoading(false);
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const handleAccept = async (applicationId: string) => {
    setAccepting(applicationId);
    try {
      await acceptExtraWorkApplication(applicationId);
      load();
    } catch (e: any) {
      Alert.alert('오류', e?.message ?? '수락에 실패했습니다.');
    } finally {
      setAccepting(null);
    }
  };

  const handleCreate = async () => {
    if (!date || !startTime || !endTime) return;
    setSubmitting(true);
    try {
      await createExtraWorkRequest({ storeId, requestedDate: date, requestedStartTime: startTime, requestedEndTime: endTime });
      setShowSheet(false); setDate(''); setStartTime(''); setEndTime('');
      load();
    } catch (e: any) {
      Alert.alert('오류', e?.message ?? '등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.brand[600]} /></View>;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.neutral[500], textTransform: 'uppercase', letterSpacing: 0.8 }}>등록한 추가 근무</Text>
          <TouchableOpacity onPress={() => setShowSheet(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 7, backgroundColor: colors.brand[700] }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#fff' }}>+ 등록</Text>
          </TouchableOpacity>
        </View>

        {requests.length === 0 && (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: colors.neutral[400] }}>등록된 추가 근무가 없습니다</Text>
          </View>
        )}

        {requests.map(req => {
          const apps = applications[req.id] ?? [];
          const pendingApps = apps.filter(a => a.status === 'pending');
          return (
            <View key={req.id} style={{ borderRadius: 14, borderWidth: 1.5, borderColor: colors.neutral[100], padding: 14, marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.neutral[900] }}>{req.requested_date}</Text>
                  <Text style={{ fontSize: 11, color: colors.neutral[400], marginTop: 2 }}>
                    {req.requested_start_time} – {req.requested_end_time}
                  </Text>
                </View>
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1, borderColor: pendingApps.length > 0 ? colors.brand[300] : colors.neutral[300] }}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: pendingApps.length > 0 ? colors.brand[700] : colors.neutral[500] }}>
                    신청 {pendingApps.length}명
                  </Text>
                </View>
              </View>
              {pendingApps.length > 0 ? (
                pendingApps.map(app => (
                  <TouchableOpacity key={app.id} onPress={() => handleAccept(app.id)} disabled={accepting === app.id}
                    style={{ paddingVertical: 10, borderRadius: 9, alignItems: 'center', backgroundColor: colors.brand[700], marginBottom: 4 }}>
                    {accepting === app.id
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>수락 처리</Text>
                    }
                  </TouchableOpacity>
                ))
              ) : (
                <View style={{ paddingVertical: 10, borderRadius: 9, alignItems: 'center', backgroundColor: colors.neutral[100] }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.neutral[400] }}>신청 없음</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={showSheet} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={() => setShowSheet(false)} />
          <View style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, backgroundColor: colors.neutral[0] }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.neutral[300], alignSelf: 'center', marginBottom: 14 }} />
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.neutral[900], marginBottom: 14 }}>추가 근무 등록</Text>
            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.neutral[500], marginBottom: 4 }}>날짜 (YYYY-MM-DD)</Text>
              <TextInput value={date} onChangeText={setDate} placeholder="2026-05-24" placeholderTextColor={colors.neutral[300]}
                style={{ borderWidth: 1.5, borderColor: colors.neutral[200], borderRadius: 9, padding: 10, fontSize: 13, color: colors.neutral[900] }} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: colors.neutral[500], marginBottom: 4 }}>시작 (HH:MM)</Text>
                <TextInput value={startTime} onChangeText={setStartTime} placeholder="09:00" placeholderTextColor={colors.neutral[300]}
                  style={{ borderWidth: 1.5, borderColor: colors.neutral[200], borderRadius: 9, padding: 10, fontSize: 13, color: colors.neutral[900] }} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: colors.neutral[500], marginBottom: 4 }}>종료 (HH:MM)</Text>
                <TextInput value={endTime} onChangeText={setEndTime} placeholder="18:00" placeholderTextColor={colors.neutral[300]}
                  style={{ borderWidth: 1.5, borderColor: colors.neutral[200], borderRadius: 9, padding: 10, fontSize: 13, color: colors.neutral[900] }} />
              </View>
            </View>
            <TouchableOpacity onPress={handleCreate} disabled={submitting || !date || !startTime || !endTime}
              style={{ paddingVertical: 14, borderRadius: 16, alignItems: 'center', marginBottom: 24, backgroundColor: colors.brand[700] }}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>등록하기</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ── QR 생성 탭 ───────────────────────────────────────────────────────────────

const QR_TTL = 10;

function QRTab({ storeId }: { storeId: string }) {
  const [qrData, setQrData] = useState('');
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const token = await createQrToken(storeId);
      setQrData(JSON.stringify({ storeId, token: token.token }));
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

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, alignItems: 'center' }}>
      <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', width: '100%', borderWidth: 1.5, borderColor: colors.neutral[100], marginBottom: 16 }}>
        {loading ? (
          <View style={{ width: 160, height: 160, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={colors.brand[600]} size="large" />
          </View>
        ) : qrData && !expired ? (
          <QRCode value={qrData} size={160} color="#111827" backgroundColor="#fff" />
        ) : (
          <View style={{ width: 160, height: 160, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 28, fontWeight: '800', color: colors.neutral[300] }}>만료됨</Text>
          </View>
        )}

        {!expired ? (
          <>
            <Text style={{ fontSize: 52, fontWeight: '800', color: colors.brand[700], lineHeight: 64, marginTop: 12 }}>{String(timer).padStart(2, '0')}</Text>
            <Text style={{ fontSize: 13, color: colors.neutral[400] }}>초 후 만료</Text>
          </>
        ) : (
          <Text style={{ fontSize: 13, color: colors.neutral[400], marginTop: 12 }}>재생성 버튼을 눌러주세요</Text>
        )}
      </View>

      <TouchableOpacity onPress={generate} disabled={loading} style={{ width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1.5, borderColor: colors.brand[300], marginBottom: 14 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.brand[700] }}>QR 재생성</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 12, color: colors.neutral[400], textAlign: 'center', lineHeight: 18 }}>QR은 {QR_TTL}초간 유효합니다.{'\n'}직원이 앱에서 스캔하면 출퇴근이 기록됩니다.</Text>
    </ScrollView>
  );
}

// ── 승급 승인 탭 ─────────────────────────────────────────────────────────────

function LevelUpTab() {
  const { walletAddress } = useAuthStore();
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState<string | null>(null);

  useEffect(() => {
    getPendingApprovals().then(setApprovals).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSign = async (approval: PendingApproval) => {
    if (!walletAddress) return;
    setSigning(approval.request_id);
    try {
      const { typed_data } = await getSigningPayload(approval.request_id);
      const client = await getWcClient();
      const sessions = client.session.getAll();
      if (!sessions.length) { Alert.alert('오류', '지갑이 연결되어 있지 않습니다.'); return; }
      const signature = await client.request<string>({
        topic: sessions[0].topic,
        chainId: 'eip155:11155111',
        request: { method: 'eth_signTypedData_v4', params: [walletAddress, JSON.stringify(typed_data)] },
      });
      await signApproval({ levelUpRequestId: approval.request_id, managerSignature: signature });
      setApprovals(prev => prev.filter(a => a.request_id !== approval.request_id));
      Alert.alert('승인 완료', `${approval.user_name}의 승급을 승인했습니다.`);
    } catch (e: any) {
      Alert.alert('서명 실패', e?.message ?? '다시 시도해 주세요.');
    } finally {
      setSigning(null);
    }
  };

  if (loading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.brand[600]} /></View>;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {approvals.length === 0 ? (
        <View style={{ paddingVertical: 24, alignItems: 'center' }}>
          <Text style={{ fontSize: 13, color: colors.neutral[400] }}>대기 중인 승급 요청이 없습니다</Text>
        </View>
      ) : approvals.map(approval => (
        <View key={approval.request_id} style={{ borderRadius: 16, borderWidth: 1.5, borderColor: colors.neutral[200], padding: 16, marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Avatar />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.neutral[900] }}>{approval.user_name}</Text>
              <Text style={{ fontSize: 11, color: colors.neutral[400], marginTop: 1 }}>Lv.{approval.current_level} → Lv.{approval.target_level} 승급 요청</Text>
            </View>
            <Text style={{ fontSize: 10, color: colors.neutral[400] }}>{new Date(approval.requested_at).toLocaleDateString('ko-KR')}</Text>
          </View>
          <TouchableOpacity onPress={() => handleSign(approval)} disabled={signing === approval.request_id}
            style={{ paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: colors.brand[700] }}>
            {signing === approval.request_id ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>서명 후 승인</Text>}
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

// ── 메인 화면 ─────────────────────────────────────────────────────────────────

export default function StoreManagementScreen({ navigation, route }: ManagerScreenProps<'StoreManagement'>) {
  const { storeId } = route.params;
  const [activeTab, setActiveTab] = useState<StoreTab>('인사 관리');
  const [storeName, setStoreName] = useState('');
  const [storeCode, setStoreCode] = useState('');

  useEffect(() => {
    // storeId로 매장 정보 가져오기 - ManagerHomeScreen에서 navigation으로 넘겨받도록 개선 가능
    // 현재는 storeId만 가지고 있어서 화면 상단 이름은 추후 params 추가 시 처리
    setStoreName(storeId);
  }, [storeId]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral[0] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12, borderBottomWidth: 1, borderColor: colors.neutral[100] }}>
        <TouchableOpacity onPress={() => navigation.goBack()}><BackChevron /></TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: colors.neutral[900] }}>{storeName}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexShrink: 0, borderBottomWidth: 1, borderColor: colors.neutral[100] }}>
        {STORE_TABS.map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}
            style={{ paddingHorizontal: 16, paddingVertical: 11, position: 'relative' }} activeOpacity={0.7}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: activeTab === tab ? colors.brand[700] : colors.neutral[400] }}>{tab}</Text>
            {activeTab === tab && <View style={{ position: 'absolute', bottom: 0, left: 10, right: 10, height: 2, backgroundColor: colors.brand[700], borderRadius: 2 }} />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {activeTab === '인사 관리' && <HRTab storeId={storeId} storeCode={storeCode} onWorkerPress={(userId) => navigation.navigate('CareerReport', { userId })} />}
      {activeTab === '근태 관리' && <AttendanceTab storeId={storeId} />}
      {activeTab === '추가 근무' && <ExtraWorkTab storeId={storeId} />}
      {activeTab === 'QR 생성' && <QRTab storeId={storeId} />}
      {activeTab === '승급 승인' && <LevelUpTab />}
    </View>
  );
}
