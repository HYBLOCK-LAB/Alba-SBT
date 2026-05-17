import { IsEthereumAddress } from 'class-validator';

export class RequestSiweNonceDto {
  @IsEthereumAddress({ message: '유효한 지갑 주소를 입력해주세요' })
  walletAddress!: string;
}
