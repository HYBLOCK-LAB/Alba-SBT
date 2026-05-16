import { IsEthereumAddress, IsNotEmpty, IsString } from 'class-validator';

export class VerifySiweDto {
  @IsEthereumAddress({ message: '유효한 지갑 주소를 입력해주세요' })
  walletAddress!: string;

  @IsString()
  @IsNotEmpty({ message: 'SIWE message가 필요합니다' })
  message!: string;

  @IsString()
  @IsNotEmpty({ message: '서명값이 필요합니다' })
  signature!: string;
}
