import { SignClient } from '@walletconnect/sign-client';
import { WC_PROJECT_ID, WC_METADATA, CHAIN_ID } from '../constants/walletConnect';
import { createSiweMessage } from './siwe';

const SEPOLIA_CHAIN = `eip155:${CHAIN_ID}`;

// ── WalletConnect SignClient (lazy init) ───────────────────────────────────
let wcClient: Awaited<ReturnType<typeof SignClient.init>> | null = null;

async function getWcClient() {
  if (!wcClient) {
    wcClient = await SignClient.init({
      projectId: WC_PROJECT_ID,
      metadata: {
        name: WC_METADATA.name,
        description: WC_METADATA.description,
        url: WC_METADATA.url,
        icons: WC_METADATA.icons,
        redirect: WC_METADATA.redirect,
      },
    });
  }
  return wcClient;
}

// ── WalletConnect connection ───────────────────────────────────────────────
export async function connectWalletConnect(): Promise<{
  address: string;
  signMessage: (nonce: string) => Promise<string>;
  uri: string;
}> {
  const client = await getWcClient();

  const { uri, approval } = await client.connect({
    requiredNamespaces: {
      eip155: {
        methods: ['eth_sign', 'personal_sign'],
        chains: [SEPOLIA_CHAIN],
        events: ['chainChanged', 'accountsChanged'],
      },
    },
  });

  // URI를 먼저 반환해서 QR/딥링크 표시 → 승인 대기
  const sessionPromise = approval();

  const session = await sessionPromise;
  const accounts = session.namespaces.eip155?.accounts ?? [];
  const address = accounts[0]?.split(':')[2] ?? '';

  const signMessage = async (nonce: string): Promise<string> => {
    const message = createSiweMessage(address, nonce);
    const signature = await client.request<string>({
      topic: session.topic,
      chainId: SEPOLIA_CHAIN,
      request: {
        method: 'personal_sign',
        params: [message, address],
      },
    });
    return signature;
  };

  return { address, signMessage, uri: uri ?? '' };
}

// ── MetaMask deeplink (모바일 앱에서 MetaMask 앱 열기) ─────────────────────
// MetaMask SDK React Native는 Provider 컨텍스트 기반 — hooks로 사용
// 아래는 WalletConnect를 통한 MetaMask 연결 (동일 SDK, 지갑만 MetaMask)
export async function connectMetaMaskViaWC(): Promise<{
  address: string;
  signMessage: (nonce: string) => Promise<string>;
  uri: string;
}> {
  // WalletConnect URI를 MetaMask 딥링크에 주입
  return connectWalletConnect();
}

export { getWcClient };
