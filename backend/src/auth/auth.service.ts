import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getAddress } from 'ethers';
import { generateNonce, SiweMessage } from 'siwe';
import { Lv1MintService } from '../blockchain/lv1-mint.service';
import { SupabaseService } from '../common/supabase/supabase.service';
import { kstTimestampAfter, kstTimestampNow } from '../common/utils/kst-date';
import { CompleteSignupDto } from './dto/complete-signup.dto';
import { VerifySiweDto } from './dto/verify-siwe.dto';

interface ExistingUserRow {
  id: string;
  wallet_address: string;
  account_type: 'worker' | 'manager';
}

interface SignupTokenPayload {
  tokenType: 'signup';
  walletAddress: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  private static readonly NONCE_TTL_MS = 5 * 60 * 1000;
  private static readonly SIGNUP_TOKEN_TTL = '15m';

  constructor(
    private readonly supabase: SupabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly lv1MintService: Lv1MintService,
  ) {}

  async requestSiweNonce(walletAddress: string) {
    const normalizedWalletAddress = this.normalizeWalletAddress(walletAddress);
    const nonce = generateNonce();
    const expiresAt = kstTimestampAfter(AuthService.NONCE_TTL_MS);

    await this.deleteActiveNoncesForWallet(normalizedWalletAddress);

    const { error } = await this.supabase.client.from('siwe_nonces').insert({
      nonce,
      wallet_address: normalizedWalletAddress,
      expires_at: expiresAt,
    });

    if (error) {
      throw new InternalServerErrorException('SIWE nonce를 발급하지 못했습니다');
    }

    return {
      nonce,
      expiresAt,
    };
  }

  async verifySiwe(dto: VerifySiweDto) {
    const normalizedWalletAddress = this.normalizeWalletAddress(dto.walletAddress);
    const siweMessage = this.parseSiweMessage(dto.message);

    if (this.normalizeWalletAddress(siweMessage.address) !== normalizedWalletAddress) {
      throw new UnauthorizedException('지갑 주소가 서명 메시지와 일치하지 않습니다');
    }

    const nonceRow = await this.getNonceRow(siweMessage.nonce);

    if (!nonceRow) {
      throw new UnauthorizedException('Nonce를 찾을 수 없습니다');
    }

    if (nonceRow.wallet_address !== normalizedWalletAddress) {
      throw new UnauthorizedException('지갑 주소가 nonce 요청과 일치하지 않습니다');
    }

    if (nonceRow.expires_at < kstTimestampNow()) {
      await this.deleteNonce(nonceRow.nonce);
      throw new UnauthorizedException('Nonce가 만료되었습니다');
    }

    this.assertConfiguredSiweFields(siweMessage);

    const verifyResult = await siweMessage.verify(
      {
        signature: dto.signature,
        nonce: nonceRow.nonce,
        domain: this.configService.get<string>('SIWE_DOMAIN') || undefined,
        time: new Date().toISOString(),
      },
      { suppressExceptions: true },
    );

    if (!verifyResult.success) {
      throw new UnauthorizedException('SIWE 서명 검증에 실패했습니다');
    }

    await this.deleteNonce(nonceRow.nonce);

    const user = await this.findUserByWalletAddress(normalizedWalletAddress);

    if (!user) {
      return {
        token: null,
        signupToken: await this.signSignupToken(normalizedWalletAddress),
        walletAddress: normalizedWalletAddress,
        isNewUser: true,
        accountType: null,
      };
    }

    const token = await this.signAccessToken(user);

    return {
      token,
      signupToken: null,
      walletAddress: normalizedWalletAddress,
      isNewUser: false,
      accountType: user.account_type,
    };
  }

  async completeSignup(dto: CompleteSignupDto) {
    const signupTokenPayload = await this.verifySignupToken(dto.signupToken);
    const existingUser = await this.findUserByWalletAddress(signupTokenPayload.walletAddress);

    if (existingUser) {
      throw new ConflictException('이미 가입된 지갑 주소입니다');
    }

    const { data, error } = await this.supabase.client
      .from('users')
      .insert({
        wallet_address: signupTokenPayload.walletAddress,
        account_type: dto.accountType,
        name: dto.name.trim(),
        email: dto.email ?? null,
        phone: dto.phone ?? null,
      })
      .select('id, wallet_address, account_type')
      .single();

    if (error || !data) {
      throw new InternalServerErrorException('회원가입 완료 처리에 실패했습니다');
    }

    const token = await this.signAccessToken(data);
    const initialMint = await this.lv1MintService.mintForSignup({
      userId: data.id,
      walletAddress: data.wallet_address,
    });

    return {
      token,
      walletAddress: data.wallet_address,
      isNewUser: false,
      accountType: data.account_type,
      initialMint,
    };
  }

  async deleteExpiredNonces() {
    const { error } = await this.supabase.client
      .from('siwe_nonces')
      .delete()
      .lt('expires_at', kstTimestampNow());

    if (error) {
      throw new InternalServerErrorException('만료된 nonce 정리에 실패했습니다');
    }
  }

  private async deleteActiveNoncesForWallet(walletAddress: string) {
    const { error } = await this.supabase.client
      .from('siwe_nonces')
      .delete()
      .eq('wallet_address', walletAddress)
      .gte('expires_at', kstTimestampNow());

    if (error) {
      throw new InternalServerErrorException('기존 nonce 정리에 실패했습니다');
    }
  }

  private async getNonceRow(nonce: string) {
    const { data, error } = await this.supabase.client
      .from('siwe_nonces')
      .select('nonce, wallet_address, expires_at')
      .eq('nonce', nonce)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('Nonce 조회에 실패했습니다');
    }

    return data;
  }

  private async deleteNonce(nonce: string) {
    const { error } = await this.supabase.client.from('siwe_nonces').delete().eq('nonce', nonce);

    if (error) {
      throw new InternalServerErrorException('Nonce 삭제에 실패했습니다');
    }
  }

  private async findUserByWalletAddress(walletAddress: string): Promise<ExistingUserRow | null> {
    const { data, error } = await this.supabase.client
      .from('users')
      .select('id, wallet_address, account_type')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('사용자 조회에 실패했습니다');
    }

    return data;
  }

  private async signAccessToken(user: ExistingUserRow) {
    return this.jwtService.signAsync({
      sub: user.id,
      walletAddress: user.wallet_address,
      accountType: user.account_type,
    });
  }

  private async signSignupToken(walletAddress: string) {
    return this.jwtService.signAsync(
      {
        tokenType: 'signup',
        walletAddress,
      } satisfies SignupTokenPayload,
      {
        expiresIn: AuthService.SIGNUP_TOKEN_TTL,
      },
    );
  }

  private async verifySignupToken(signupToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<SignupTokenPayload>(signupToken, {
        algorithms: ['HS256'],
      });

      if (payload.tokenType !== 'signup' || typeof payload.walletAddress !== 'string') {
        throw new UnauthorizedException('signupToken 형식이 올바르지 않습니다');
      }

      return {
        tokenType: payload.tokenType,
        walletAddress: this.normalizeWalletAddress(payload.walletAddress),
      } satisfies SignupTokenPayload;
    } catch {
      throw new UnauthorizedException('signupToken이 유효하지 않습니다');
    }
  }

  private parseSiweMessage(message: string) {
    try {
      return new SiweMessage(message);
    } catch {
      throw new BadRequestException('유효한 SIWE message 형식이 아닙니다');
    }
  }

  private assertConfiguredSiweFields(siweMessage: SiweMessage) {
    const expectedUri = this.configService.get<string>('SIWE_URI');
    const expectedChainId = this.configService.get<number>('SIWE_CHAIN_ID');

    if (expectedUri && siweMessage.uri !== expectedUri) {
      throw new UnauthorizedException('SIWE URI가 예상 값과 일치하지 않습니다');
    }

    if (expectedChainId && siweMessage.chainId !== Number(expectedChainId)) {
      throw new UnauthorizedException('SIWE chain id가 예상 값과 일치하지 않습니다');
    }
  }

  private normalizeWalletAddress(walletAddress: string) {
    try {
      return getAddress(walletAddress);
    } catch {
      throw new BadRequestException('유효한 지갑 주소 형식이 아닙니다');
    }
  }
}
