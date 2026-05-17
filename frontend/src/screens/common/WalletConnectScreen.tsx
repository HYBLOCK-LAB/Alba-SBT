import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { colors } from '../../constants/theme';
import { connectWalletConnect, getWcClient } from '../../services/walletService';
import { createSiweMessage } from '../../services/siwe';
import { siweLogin, getUserByWallet } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import type { AuthScreenProps } from '../../navigation/types';

function ChevronRight() {
  return (
    <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: 7, height: 7,
        borderTopWidth: 1.5, borderRightWidth: 1.5,
        borderColor: colors.neutral[300],
        transform: [{ rotate: '45deg' }],
      }} />
    </View>
  );
}

function WalletOption({
  iconBg, iconColor, name, desc, onPress, loading,
}: {
  iconBg: string; iconColor: string; name: string;
  desc: string; onPress: () => void; loading?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      disabled={loading}
      className="flex-row items-center gap-4 p-4 rounded-2xl border"
      style={{ borderColor: colors.neutral[200], backgroundColor: colors.neutral[0] }}
    >
      <View className="w-11 h-11 rounded-xl items-center justify-center" style={{ backgroundColor: iconBg }}>
        <View className="w-6 h-6 rounded-md" style={{ backgroundColor: iconColor }} />
      </View>
      <View className="flex-1">
        <Text className="font-bold text-base" style={{ color: colors.neutral[900] }}>{name}</Text>
        <Text className="text-xs mt-0.5" style={{ color: colors.neutral[400] }}>{desc}</Text>
      </View>
      {loading
        ? <ActivityIndicator size="small" color={colors.brand[600]} />
        : <ChevronRight />}
    </TouchableOpacity>
  );
}

async function loginWithAddress(
  address: string,
  signMessage: (nonce: string) => Promise<string>,
  setToken: (t: string) => void,
  setWalletAddress: (a: string) => void,
  setUser: (u: any) => void,
) {
  const nonce = Math.random().toString(36).slice(2);
  const message = createSiweMessage(address, nonce);
  const signature = await signMessage(nonce);

  const { token, user } = await siweLogin(address, message, signature);
  setToken(token);
  setWalletAddress(address);
  setUser(user);
  return user;
}

export default function WalletConnectScreen({ navigation }: AuthScreenProps<'WalletConnect'>) {
  const [loadingMM, setLoadingMM] = useState(false);
  const [loadingWC, setLoadingWC] = useState(false);
  const { setToken, setWalletAddress, setUser } = useAuthStore();

  const afterLogin = (user: any) => {
    // 신규 유저면 AccountType으로, 기존 유저면 바로 홈으로
    if (!user.account_type) {
      navigation.navigate('AccountType');
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: user.account_type === 'manager' ? ('ManagerTab' as any) : ('WorkerTab' as any) }],
      });
    }
  };

  const handleMetaMask = async () => {
    setLoadingMM(true);
    try {
      const client = await getWcClient();
      const { uri, approval } = await client.connect({
        requiredNamespaces: {
          eip155: {
            methods: ['eth_sign', 'personal_sign'],
            chains: ['eip155:11155111'],
            events: ['chainChanged', 'accountsChanged'],
          },
        },
      });
      if (uri) Linking.openURL(`metamask://wc?uri=${encodeURIComponent(uri)}`);
      const session = await approval();
      const accounts = session.namespaces.eip155?.accounts ?? [];
      const address = accounts[0]?.split(':')[2] ?? '';

      const signMessage = async (nonce: string) => {
        const message = createSiweMessage(address, nonce);
        return client.request<string>({
          topic: session.topic,
          chainId: 'eip155:11155111',
          request: { method: 'personal_sign', params: [message, address] },
        });
      };

      const user = await loginWithAddress(address, signMessage, setToken, setWalletAddress, setUser);
      afterLogin(user);
    } catch (e: any) {
      Alert.alert('MetaMask 연결 실패', e?.message ?? '다시 시도해 주세요.');
    } finally {
      setLoadingMM(false);
    }
  };

  const handleWalletConnect = async () => {
    setLoadingWC(true);
    try {
      const client = await getWcClient();
      const { uri, approval } = await client.connect({
        requiredNamespaces: {
          eip155: {
            methods: ['eth_sign', 'personal_sign'],
            chains: ['eip155:11155111'],
            events: ['chainChanged', 'accountsChanged'],
          },
        },
      });
      if (uri) Linking.openURL(uri);
      const session = await approval();
      const accounts = session.namespaces.eip155?.accounts ?? [];
      const address = accounts[0]?.split(':')[2] ?? '';

      const signMessage = async (nonce: string) => {
        const message = createSiweMessage(address, nonce);
        return client.request<string>({
          topic: session.topic,
          chainId: 'eip155:11155111',
          request: { method: 'personal_sign', params: [message, address] },
        });
      };

      const user = await loginWithAddress(address, signMessage, setToken, setWalletAddress, setUser);
      afterLogin(user);
    } catch (e: any) {
      Alert.alert('WalletConnect 연결 실패', e?.message ?? '다시 시도해 주세요.');
    } finally {
      setLoadingWC(false);
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.neutral[900] }}>
      <View className="px-6 pt-16 pb-10 items-center">
        <View
          className="w-16 h-16 rounded-2xl items-center justify-center mb-6"
          style={{ backgroundColor: colors.brand[700] }}
        >
          <View className="w-8 h-8 rounded-lg" style={{ backgroundColor: colors.brand[400] }} />
        </View>
        <Text className="text-white font-extrabold text-2xl tracking-tight mb-2">지갑 연동</Text>
        <Text className="text-sm text-center leading-relaxed" style={{ color: colors.neutral[400] }}>
          Alba-SBT는 지갑 주소를 기반으로{'\n'}로그인합니다. 비밀번호가 없습니다.
        </Text>
      </View>

      <View className="flex-1 rounded-t-3xl px-5 pt-6" style={{ backgroundColor: colors.neutral[0] }}>
        <Text className="text-xs font-semibold mb-4 tracking-wider uppercase" style={{ color: colors.neutral[400] }}>
          지갑 선택
        </Text>
        <View className="gap-3">
          <WalletOption
            iconBg="#fff6e5" iconColor="#f6851b"
            name="MetaMask" desc="가장 널리 사용되는 암호화폐 지갑"
            onPress={handleMetaMask} loading={loadingMM}
          />
          <WalletOption
            iconBg="#e8f0fa" iconColor={colors.brand[600]}
            name="WalletConnect" desc="모든 WalletConnect 호환 지갑"
            onPress={handleWalletConnect} loading={loadingWC}
          />
        </View>

        <View className="flex-row gap-3 mt-5 p-3.5 rounded-xl" style={{ backgroundColor: colors.neutral[50] }}>
          <View className="w-0.5 rounded-full self-stretch" style={{ backgroundColor: colors.brand[300] }} />
          <Text className="flex-1 text-xs leading-relaxed" style={{ color: colors.neutral[500] }}>
            지갑 연동 시 서명 요청이 발생합니다. 트랜잭션이 아닌 메시지 서명이므로 가스비가 청구되지 않습니다.
          </Text>
        </View>
      </View>
    </View>
  );
}
