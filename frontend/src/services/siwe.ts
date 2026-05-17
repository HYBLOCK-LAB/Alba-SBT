import { SiweMessage } from 'siwe';
import { CHAIN_ID } from '../constants/walletConnect';

export function createSiweMessage(address: string, nonce: string): string {
  const message = new SiweMessage({
    domain: 'albasbt.app',
    address,
    statement: 'AlbaSBT에 로그인합니다. 이 서명은 가스비가 발생하지 않습니다.',
    uri: 'https://albasbt.app',
    version: '1',
    chainId: CHAIN_ID,
    nonce,
  });
  return message.prepareMessage();
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
