import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Alert, AppState, StyleSheet, Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { colors } from '../../constants/theme';
import { clockIn, clockOut } from '../../services/attendanceService';
import type { WorkerScreenProps } from '../../navigation/types';

type ScanMode = '출근' | '퇴근';

const SCREEN_WIDTH = Dimensions.get('window').width;
const FINDER_SIZE = 220;

function Corner({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const s = styles;
  return (
    <View style={[
      s.corner,
      position === 'tl' && { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 4 },
      position === 'tr' && { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 4 },
      position === 'bl' && { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 4 },
      position === 'br' && { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 4 },
    ]} />
  );
}

export default function QRScannerScreen({ navigation }: WorkerScreenProps<'QRScanner'>) {
  const [mode, setMode] = useState<ScanMode>('출근');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'checking' | 'ok' | 'denied' | 'error'>('checking');
  const locationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active') setScanned(false);
      appState.current = next;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setGpsStatus('denied'); return; }
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        locationRef.current = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setGpsStatus('ok');
      } catch {
        setGpsStatus('error');
      }
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || processing) return;
    setScanned(true);
    setProcessing(true);

    // QR 데이터 형식: JSON { storeId, token }
    let parsed: { storeId: string; token: string } | null = null;
    try {
      parsed = JSON.parse(data);
    } catch {
      Alert.alert('오류', '유효하지 않은 QR 코드입니다.', [{ text: '확인', onPress: () => setScanned(false) }]);
      setProcessing(false);
      return;
    }

    const loc = locationRef.current ?? { latitude: 0, longitude: 0 };

    try {
      if (mode === '출근') {
        await clockIn({ store_id: parsed.storeId, qr_token: parsed.token, ...loc });
        Alert.alert('출근 완료', '출근이 기록되었습니다.', [{
          text: '확인', onPress: () => { setScanned(false); if (navigation.canGoBack()) navigation.goBack(); },
        }]);
      } else {
        await clockOut({ store_id: parsed.storeId, ...loc });
        Alert.alert('퇴근 완료', '퇴근이 기록되었습니다.', [{
          text: '확인', onPress: () => { setScanned(false); if (navigation.canGoBack()) navigation.goBack(); },
        }]);
      }
    } catch (e: any) {
      Alert.alert(`${mode} 실패`, e?.message ?? '다시 시도해 주세요.', [
        { text: '확인', onPress: () => setScanned(false) },
      ]);
    } finally {
      setProcessing(false);
    }
  };

  if (!permission) return <View style={{ flex: 1, backgroundColor: '#0a0a0a' }} />;

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>카메라 권한이 필요합니다</Text>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>QR 스캔을 위해 카메라 접근을 허용해 주세요</Text>
        <TouchableOpacity onPress={requestPermission} style={{ backgroundColor: colors.brand[700], paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>권한 허용</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 12, padding: 8 }}>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const gpsColor = gpsStatus === 'ok' ? colors.brand[500] : gpsStatus === 'checking' ? colors.neutral[400] : colors.error;
  const gpsText = { checking: 'GPS 확인 중...', ok: 'GPS 확인됨', denied: 'GPS 권한이 필요합니다', error: 'GPS 신호를 찾을 수 없습니다' }[gpsStatus];
  const gpsBg = gpsStatus === 'ok' ? colors.brand[50] : gpsStatus === 'checking' ? colors.neutral[100] : '#fef2f2';

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <View style={{ width: 10, height: 10, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: '#fff', transform: [{ rotate: '45deg' }] }} />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>QR 스캔</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ position: 'absolute', top: 130, bottom: 280, left: 0, width: (SCREEN_WIDTH - FINDER_SIZE) / 2, backgroundColor: 'rgba(0,0,0,0.55)' }} />
      <View style={{ position: 'absolute', top: 130, bottom: 280, right: 0, width: (SCREEN_WIDTH - FINDER_SIZE) / 2, backgroundColor: 'rgba(0,0,0,0.55)' }} />
      <View style={{ position: 'absolute', top: 110, left: 0, right: 0, height: 20, backgroundColor: 'rgba(0,0,0,0.55)' }} />

      <View style={{ position: 'absolute', top: 130, bottom: 280, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: FINDER_SIZE, height: FINDER_SIZE }}>
          <Corner position="tl" />
          <Corner position="tr" />
          <Corner position="bl" />
          <Corner position="br" />
          {!scanned && (
            <View style={{ position: 'absolute', top: '50%', left: 8, right: 8, height: 2, backgroundColor: colors.brand[400], borderRadius: 1, opacity: 0.85 }} />
          )}
          {scanned && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: `${colors.brand[700]}30`, alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.brand[700], alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 12, height: 18, borderRightWidth: 2.5, borderBottomWidth: 2.5, borderColor: '#fff', transform: [{ rotate: '45deg' }, { translateY: -2 }] }} />
              </View>
            </View>
          )}
        </View>
      </View>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: colors.neutral[0], paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', backgroundColor: colors.neutral[100], borderRadius: 12, padding: 4, marginBottom: 14 }}>
          {(['출근', '퇴근'] as ScanMode[]).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setMode(m)}
              style={[
                { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
                mode === m ? { backgroundColor: colors.neutral[0], shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 } : {},
              ]}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: mode === m ? colors.brand[700] : colors.neutral[400] }}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ fontSize: 13, textAlign: 'center', fontWeight: '500', color: colors.neutral[600], marginBottom: 12 }}>
          매장 QR 코드를 화면 안에 맞춰주세요
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: gpsBg }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: gpsColor }} />
          <Text style={{ fontSize: 12, fontWeight: '500', color: gpsColor }}>{gpsText}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  corner: { position: 'absolute', width: 28, height: 28, borderColor: '#fff' },
});
