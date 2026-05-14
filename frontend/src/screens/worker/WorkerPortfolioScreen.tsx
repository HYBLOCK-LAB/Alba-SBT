import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Share, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { colors } from '../../constants/theme';
import type { WorkerTabScreenProps } from '../../navigation/types';

// ── Simple QR visual (CSS-grid style) ────────────────────────────────────
const QR_PATTERN = [
  [1,1,1,1,1,1,1,0,1,1,1,1,1,1],
  [1,0,0,0,0,0,1,0,1,0,0,0,1,0],
  [1,0,1,1,1,0,1,0,0,1,0,1,0,1],
  [1,0,1,1,1,0,1,0,1,0,1,1,1,0],
  [1,0,0,0,0,0,1,0,0,1,0,0,0,1],
  [1,1,1,1,1,1,1,0,1,0,1,0,1,0],
  [0,0,0,0,0,0,0,0,0,1,0,0,0,1],
  [1,0,1,1,0,1,0,1,1,0,1,1,0,1],
  [0,1,0,0,1,0,1,0,0,1,0,1,1,0],
  [1,0,1,1,1,1,1,1,1,0,1,0,0,1],
  [1,1,1,1,1,1,1,0,0,1,1,1,1,0],
  [1,0,0,0,0,0,1,0,1,0,0,0,0,1],
  [1,0,1,1,1,0,1,0,0,1,1,0,1,0],
  [1,1,1,1,1,1,1,0,1,0,0,1,0,1],
];

function QRPattern() {
  const cellSize = 8;
  return (
    <View style={{ width: cellSize * 14, height: cellSize * 14, position: 'relative' }}>
      {QR_PATTERN.map((row, ri) =>
        row.map((cell, ci) => (
          <View
            key={`${ri}-${ci}`}
            style={{
              position: 'absolute',
              left: ci * cellSize,
              top: ri * cellSize,
              width: cellSize - 1,
              height: cellSize - 1,
              borderRadius: 1,
              backgroundColor: cell ? colors.neutral[900] : 'transparent',
            }}
          />
        ))
      )}
      {/* Center logo */}
      <View style={{
        position: 'absolute',
        top: cellSize * 5.5, left: cellSize * 5.5,
        width: cellSize * 3, height: cellSize * 3,
        borderRadius: cellSize * 1.5,
        backgroundColor: colors.neutral[0],
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4, elevation: 3,
      }}>
        <View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: colors.brand[700] }} />
      </View>
    </View>
  );
}

interface BadgeCardProps {
  icon: React.ReactNode;
  name: string;
  type: string;
  locked?: boolean;
}

function BadgeCard({ icon, name, type, locked }: BadgeCardProps) {
  return (
    <View
      className="flex-1 rounded-2xl p-3 items-center"
      style={{
        backgroundColor: colors.neutral[0],
        borderWidth: 1, borderColor: colors.neutral[100],
        opacity: locked ? 0.4 : 1,
        margin: 4,
      }}
    >
      <View style={{
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: locked ? colors.neutral[100] : `${colors.brand[700]}12`,
        alignItems: 'center', justifyContent: 'center', marginBottom: 6,
      }}>
        {icon}
      </View>
      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.neutral[800], textAlign: 'center' }}>{name}</Text>
      <Text style={{ fontSize: 10, color: colors.neutral[400], textAlign: 'center', marginTop: 2 }}>{type}</Text>
      {locked && (
        <View style={{ marginTop: 4 }}>
          <View style={{ width: 10, height: 12, borderWidth: 1.5, borderColor: colors.neutral[400], borderRadius: 2, marginBottom: -6, alignSelf: 'center' }} />
          <View style={{ width: 14, height: 10, borderWidth: 1.5, borderColor: colors.neutral[400], borderRadius: 2, alignSelf: 'center' }} />
        </View>
      )}
    </View>
  );
}

// Simple icon views
function StarIcon({ color }: { color: string }) {
  return <View style={{ width: 18, height: 18, backgroundColor: color, borderRadius: 2, transform: [{ rotate: '15deg' }] }} />;
}
function ShieldIcon({ color }: { color: string }) {
  return <View style={{ width: 14, height: 18, backgroundColor: color, borderRadius: 3, borderTopLeftRadius: 7, borderTopRightRadius: 7 }} />;
}
function CheckIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 6, height: 9, borderBottomWidth: 2, borderRightWidth: 2, borderColor: color, transform: [{ rotate: '45deg' }, { translateY: -1 }] }} />
    </View>
  );
}
function PlusIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: 14, height: 2, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ position: 'absolute', width: 2, height: 14, backgroundColor: color, borderRadius: 1 }} />
    </View>
  );
}

export default function WorkerPortfolioScreen({ navigation }: WorkerTabScreenProps<'WorkerPortfolio'>) {
  const portfolioUrl = 'https://albasbt.app/p/kim-alba';

  const handleCopy = async () => {
    await Clipboard.setStringAsync(portfolioUrl);
    Alert.alert('복사 완료', '링크가 클립보드에 복사되었습니다.');
  };

  const handleShare = () => {
    Share.share({ message: `AlbaSBT 포트폴리오: ${portfolioUrl}` });
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.neutral[50] }}>
      {/* Dark hero */}
      <View style={{ backgroundColor: colors.brand[900] ?? '#05284e', paddingBottom: 20 }}>
        {/* nav */}
        <View className="flex-row items-center justify-between px-4 pt-12 pb-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-1">
            <View style={{ width: 9, height: 9, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: '#fff', transform: [{ rotate: '45deg' }] }} />
          </TouchableOpacity>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>포트폴리오</Text>
          <View style={{ width: 20 }} />
        </View>

        {/* profile */}
        <View className="px-5">
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff' }}>김알바</Text>
          <Text style={{ fontSize: 12, fontWeight: '500', color: colors.brand[300], marginTop: 2 }}>Lv.2 · 성실 알바생</Text>
        </View>

        {/* stats */}
        <View className="flex-row mx-5 mt-4">
          {[
            { label: '재직기간', value: '4개월' },
            { label: '출근율', value: '96%' },
            { label: '추가근무', value: '8회' },
          ].map((s, i) => (
            <View
              key={s.label}
              className="flex-1 items-center"
              style={{ borderLeftWidth: i > 0 ? 1 : 0, borderColor: 'rgba(255,255,255,0.1)' }}
            >
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff', fontFamily: 'Inter' }}>{s.value}</Text>
              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* QR card */}
        <View className="mx-4 mt-4 rounded-3xl p-5 items-center"
          style={{ backgroundColor: colors.neutral[0], shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 }}>
          <QRPattern />
          <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 5,
              paddingHorizontal: 10, paddingVertical: 4,
              borderRadius: 20, borderWidth: 1, borderColor: colors.brand[300],
            }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.brand[500] }} />
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.brand[600] }}>EAS 인증됨</Text>
            </View>
          </View>
          <Text style={{ fontSize: 11, color: colors.neutral[400], marginTop: 4 }}>2026.05.09 발급</Text>
        </View>

        {/* Badge grid */}
        <View className="mx-4 mt-4">
          <View className="flex-row">
            <BadgeCard
              icon={<StarIcon color={colors.amber[500]} />}
              name="6개월 근속"
              type="EAS_EXP_TIME"
            />
            <BadgeCard
              icon={<ShieldIcon color={colors.brand[600]} />}
              name="성실 인증"
              type="EAS_FAITH_ATT"
            />
          </View>
          <View className="flex-row">
            <BadgeCard
              icon={<CheckIcon color={colors.neutral[400]} />}
              name="완근 인증"
              type="EAS_WORK_COMP"
              locked
            />
            <BadgeCard
              icon={<PlusIcon color={colors.neutral[400]} />}
              name="추가근무 10회"
              type="EAS_EXTRA_ACC"
              locked
            />
          </View>
        </View>

        {/* Action buttons */}
        <View className="flex-row mx-4 mt-4 mb-8 gap-2.5">
          <TouchableOpacity
            onPress={handleCopy}
            className="flex-1 py-3 rounded-xl items-center justify-center"
            style={{ borderWidth: 1.5, borderColor: colors.neutral[200] }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.neutral[700] }}>링크 복사</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleShare}
            className="flex-1 py-3 rounded-xl items-center justify-center"
            style={{ backgroundColor: colors.brand[700] }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>공유하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
