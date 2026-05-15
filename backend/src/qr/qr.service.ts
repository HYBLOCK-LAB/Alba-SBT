import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { SupabaseService } from '../common/supabase/supabase.service';
import { kstTimestampAfter, kstTimestampNow } from '../common/utils/kst-date';

@Injectable()
export class QrService {
  constructor(
    private readonly configService: ConfigService,
    private readonly supabase: SupabaseService,
  ) {}

  async createToken(storeId: string, managerId: string) {
    const { data: store, error: storeError } = await this.supabase.client
      .from('stores')
      .select('id, manager_id, qr_validity_start_hour, qr_validity_end_hour')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      throw new NotFoundException('매장을 찾을 수 없습니다');
    }

    if (store.manager_id !== managerId) {
      throw new ForbiddenException('해당 매장의 QR을 생성할 권한이 없습니다');
    }

    this.assertQrIssuableNow(
      store.qr_validity_start_hour,
      store.qr_validity_end_hour,
    );

    const token = randomUUID();
    const ttlSeconds = this.configService.get<number>('QR_TOKEN_TTL_SECONDS', 10);
    const expiresAt = kstTimestampAfter(ttlSeconds * 1000);

    await this.deleteActiveTokensForStore(storeId);

    const { data, error } = await this.supabase.client
      .from('qr_tokens')
      .insert({
        store_id: storeId,
        token,
        expires_at: expiresAt,
        created_by: managerId,
      })
      .select('id, store_id, token, expires_at, created_at')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async verifyTokenForStore(token: string, storeId: string) {
    const qrToken = await this.verifyToken(token);

    if (!qrToken || qrToken.store_id !== storeId) {
      throw new BadRequestException({
        message: 'QR 토큰이 유효하지 않습니다',
        code: 'QR_TOKEN_INVALID',
      });
    }

    return qrToken;
  }

  async verifyToken(token: string) {
    const { data, error } = await this.supabase.client
      .from('qr_tokens')
      .select('id, store_id, token, expires_at')
      .eq('token', token)
      .single();

    if (error || !data) {
      return undefined;
    }

    if (data.expires_at < kstTimestampNow()) {
      return undefined;
    }

    return data;
  }

  async deleteExpiredTokens() {
    const { error } = await this.supabase.client
      .from('qr_tokens')
      .delete()
      .lt('expires_at', kstTimestampNow());

    if (error) {
      throw new Error(error.message);
    }
  }

  private async deleteActiveTokensForStore(storeId: string) {
    const { error } = await this.supabase.client
      .from('qr_tokens')
      .delete()
      .eq('store_id', storeId)
      .gte('expires_at', kstTimestampNow());

    if (error) {
      throw new Error(error.message);
    }
  }

  private assertQrIssuableNow(startHour?: number | null, endHour?: number | null) {
    if (startHour === null || startHour === undefined || endHour === null || endHour === undefined) {
      return;
    }

    const hour = Number(kstTimestampNow().slice(11, 13));
    const isValid =
      startHour <= endHour
        ? hour >= startHour && hour < endHour
        : hour >= startHour || hour < endHour;

    if (!isValid) {
      throw new BadRequestException({
        message: '현재 시간에는 QR을 생성할 수 없습니다',
        code: 'QR_OUTSIDE_VALID_HOURS',
      });
    }
  }
}
