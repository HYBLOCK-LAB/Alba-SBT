import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Share, Alert, ActivityIndicator } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { colors } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { getLevelUpStatus, type LevelUpStatus } from '../../services/levelUpService';
import { getBadges, type Badge } from '../../services/badgesService';
import type { WorkerTabScreenProps } from '../../navigation/types';

interface BadgeCardProps {
  badge: Badge;
  unlocked: boolean;
}

function BadgeCard({ badge, unlocked }: BadgeCardProps) {
  return (
    <View
      className="flex-1 rounded-2xl p-3 items-center"
      style={{
        backgroundColor: colors.neutral[0],
        borderWidth: 1, borderColor: colors.neutral[100],
        opacity: unlocked ? 1 : 0.4,
        margin: 4,
      }}
    >
      <View style={{
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: unlocked ? `${colors.brand[700]}12` : colors.neutral[100],
        alignItems: 'center', justifyContent: 'center', marginBottom: 6,
      }}>
        <View style={{ width: 18, height: 18, backgroundColor: unlocked ? colors.brand[600] : colors.neutral[400], borderRadius: 4 }} />
      </View>
      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.neutral[800], textAlign: 'center' }}>{badge.name}</Text>
      <Text style={{ fontSize: 10, color: colors.neutral[400], textAlign: 'center', marginTop: 2 }}>Lv.{badge.level}</Text>
      {!unlocked && (
        <View style={{ marginTop: 4 }}>
          <View style={{ width: 10, height: 12, borderWidth: 1.5, borderColor: colors.neutral[400], borderRadius: 2, marginBottom: -6, alignSelf: 'center' }} />
          <View style={{ width: 14, height: 10, borderWidth: 1.5, borderColor: colors.neutral[400], borderRadius: 2, alignSelf: 'center' }} />
        </View>
      )}
    </View>
  );
}

const LEVEL_LABELS: Record<number, string> = {
  1: '신입 알바생',
  2: '성실 알바생',
  3: '베테랑 알바생',
};

export default function WorkerPortfolioScreen({ navigation }: WorkerTabScreenProps<'WorkerPortfolio'>) {
  const { user, walletAddress } = useAuthStore();
  const [levelStatus, setLevelStatus] = useState<LevelUpStatus | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getLevelUpStatus(user.id).catch(() => null),
      getBadges().catch(() => []),
    ]).then(([ls, bs]) => {
      setLevelStatus(ls);
      setBadges(bs);
    }).finally(() => setLoading(false));
  }, [user]);

  const currentLevel = levelStatus?.current_level ?? 1;
  const portfolioData = walletAddress
    ? JSON.stringify({ wallet: walletAddress, level: currentLevel })
    : '';

  const handleCopy = async () => {
    if (!walletAddress) return;
    await Clipboard.setStringAsync(walletAddress);
    Alert.alert('복사 완료', '지갑 주소가 클립보드에 복사되었습니다.');
  };

  const handleShare = () => {
    if (!walletAddress) return;
    Share.share({ message: `AlbaSBT 포트폴리오 지갑: ${walletAddress}` });
  };

  const tenure = levelStatus?.progress
    ? Math.round((levelStatus.progress.tenure_pct / 100) * 6)
    : null;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.neutral[50] }}>
      <View style={{ backgroundColor: colors.brand[900] ?? '#05284e', paddingBottom: 20 }}>
        <View className="flex-row items-center justify-between px-4 pt-12 pb-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-1">
            <View style={{ width: 9, height: 9, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: '#fff', transform: [{ rotate: '45deg' }] }} />
          </TouchableOpacity>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>포트폴리오</Text>
          <View style={{ width: 20 }} />
        </View>

        <View className="px-5">
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff' }}>{user?.name ?? '-'}</Text>
          <Text style={{ fontSize: 12, fontWeight: '500', color: colors.brand[300], marginTop: 2 }}>
            Lv.{currentLevel} · {LEVEL_LABELS[currentLevel] ?? '알바생'}
          </Text>
        </View>

        <View className="flex-row mx-5 mt-4">
          {[
            { label: '레벨', value: `Lv.${currentLevel}` },
            { label: '근속진행', value: tenure !== null ? `${tenure}개월` : '-' },
            { label: '출근율', value: levelStatus?.progress ? `${levelStatus.progress.attendance_pct}%` : '-' },
          ].map((s, i) => (
            <View
              key={s.label}
              className="flex-1 items-center"
              style={{ borderLeftWidth: i > 0 ? 1 : 0, borderColor: 'rgba(255,255,255,0.1)' }}
            >
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>{s.value}</Text>
              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand[600]} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* QR card */}
          <View className="mx-4 mt-4 rounded-3xl p-5 items-center"
            style={{ backgroundColor: colors.neutral[0], shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 }}>
            {portfolioData ? (
              <QRCode value={portfolioData} size={112} color={colors.neutral[900]} backgroundColor={colors.neutral[0]} />
            ) : (
              <View style={{ width: 112, height: 112, backgroundColor: colors.neutral[100], borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 11, color: colors.neutral[400] }}>지갑 없음</Text>
              </View>
            )}
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
          </View>

          {/* Badge grid */}
          {badges.length > 0 && (
            <View className="mx-4 mt-4">
              {Array.from({ length: Math.ceil(badges.length / 2) }, (_, i) => (
                <View key={i} className="flex-row">
                  {badges.slice(i * 2, i * 2 + 2).map(badge => (
                    <BadgeCard
                      key={badge.id}
                      badge={badge}
                      unlocked={badge.level <= currentLevel}
                    />
                  ))}
                  {badges.slice(i * 2, i * 2 + 2).length < 2 && <View className="flex-1 m-1" />}
                </View>
              ))}
            </View>
          )}

          <View className="flex-row mx-4 mt-4 mb-8 gap-2.5">
            <TouchableOpacity
              onPress={handleCopy}
              className="flex-1 py-3 rounded-xl items-center justify-center"
              style={{ borderWidth: 1.5, borderColor: colors.neutral[200] }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.neutral[700] }}>주소 복사</Text>
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
      )}
    </View>
  );
}
