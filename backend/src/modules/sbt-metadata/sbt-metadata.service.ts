import { Injectable, NotFoundException } from '@nestjs/common';

import { SupabaseService } from '../../infra/supabase/supabase.service.js';
import { BadgesService } from '../badges/badges.service.js';

type LevelUpRequest = {
  id: string;
  user_id: string;
  target_level: number;
  used_eas_uids: unknown;
  requirements_snapshot: unknown;
  minted_at: string | null;
  requested_at: string;
};

type UserRecord = {
  wallet_address: string;
};

type BadgeImage = {
  image_uri: string;
};

@Injectable()
export class SbtMetadataService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly badgesService: BadgesService
  ) {}

  async buildForLevelUpRequest(requestId: string) {
    const levelUpRequest = await this.getLevelUpRequest(requestId);
    const [user, badge] = await Promise.all([
      this.getUser(levelUpRequest.user_id),
      this.badgesService.getByLevel(levelUpRequest.target_level) as Promise<BadgeImage>
    ]);
    const issuedAt = levelUpRequest.minted_at ?? new Date().toISOString();
    const easUids = this.getUsedEasUids(levelUpRequest.used_eas_uids);

    return {
      name: this.buildName(levelUpRequest.target_level),
      description: this.buildDescription(levelUpRequest.target_level),
      image: badge.image_uri,
      external_url: this.buildExternalUrl(user.wallet_address),
      issued_at: issuedAt,
      attributes: [
        {
          trait_type: 'Level',
          value: String(levelUpRequest.target_level)
        },
        {
          trait_type: 'Issued At',
          value: issuedAt
        }
      ],
      evidence: {
        eas_uids: easUids,
        requirements_snapshot: levelUpRequest.requirements_snapshot
      }
    };
  }

  private async getLevelUpRequest(requestId: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('level_up_requests')
      .select('id, user_id, target_level, used_eas_uids, requirements_snapshot, minted_at, requested_at')
      .eq('id', requestId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new NotFoundException(`Level-up request ${requestId} was not found`);
    }

    return data as LevelUpRequest;
  }

  private async getUser(userId: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('users')
      .select('wallet_address')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new NotFoundException(`User ${userId} was not found`);
    }

    return data as UserRecord;
  }

  private getUsedEasUids(value: unknown) {
    return Array.isArray(value) ? value.filter((uid): uid is string => typeof uid === 'string') : [];
  }

  private buildName(level: number) {
    return `${this.getTierName(level)} Lv.${level}`;
  }

  private buildDescription(level: number) {
    return `Alba-SBT career badge for Lv.${level}, issued from verified EAS attestations.`;
  }

  private buildExternalUrl(walletAddress: string) {
    return `https://alba-sbt.app/portfolio?wallet=${encodeURIComponent(walletAddress)}`;
  }

  private getTierName(level: number) {
    if (level >= 10) {
      return 'Master';
    }

    if (level >= 8) {
      return 'Expert';
    }

    if (level >= 5) {
      return 'Intermediate';
    }

    return 'Beginner';
  }
}
