import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors } from '../../constants/theme';
import type { ManagerScreenProps } from '../../navigation/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const FINDER_SIZE = 220;

function Corner({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  return (
    <View style={[
      styles.corner,
      position === 'tl' && { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 4 },
      position === 'tr' && { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 4 },
      position === 'bl' && { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 4 },
      position === 'br' && { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 4 },
    ]} />
  );
}

export default function ManagerVerifyQRScreen({ navigation }: ManagerScreenProps<'ManagerVerifyQR'>) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    // TODO: POST /api/career-verify { qrData: data } → userId
    // mock: 스캔 성공 시 데모 유저 경력 리포트로 이동
    navigation.replace('CareerReport', { userId: data || 'demo' });
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

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* 상단 dim + 바 */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.55)', paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={{ width: 10, height: 10, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: '#fff', transform: [{ rotate: '45deg' }] }} />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>경력 QR 스캔</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* 좌측 dim */}
      <View style={{ position: 'absolute', top: 130, bottom: 260, left: 0, width: (SCREEN_WIDTH - FINDER_SIZE) / 2, backgroundColor: 'rgba(0,0,0,0.55)' }} />
      {/* 우측 dim */}
      <View style={{ position: 'absolute', top: 130, bottom: 260, right: 0, width: (SCREEN_WIDTH - FINDER_SIZE) / 2, backgroundColor: 'rgba(0,0,0,0.55)' }} />
      {/* 상단 dim (뷰파인더 위) */}
      <View style={{ position: 'absolute', top: 110, left: 0, right: 0, height: 20, backgroundColor: 'rgba(0,0,0,0.55)' }} />

      {/* 뷰파인더 */}
      <View style={{ position: 'absolute', top: 130, bottom: 260, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' }}>
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

      {/* 하단 패널 */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: colors.neutral[0], paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.neutral[900], textAlign: 'center', marginBottom: 6 }}>지원자 포트폴리오 QR 스캔</Text>
        <Text style={{ fontSize: 12, color: colors.neutral[400], textAlign: 'center', lineHeight: 18 }}>
          알바생이 공유한 포트폴리오 QR을 화면 안에 맞추면{'\n'}EAS 기반 경력 리포트를 즉시 조회합니다
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#fff',
  },
});
