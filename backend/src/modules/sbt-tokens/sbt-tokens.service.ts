import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { SupabaseService } from '../../infra/supabase/supabase.service.js';
import { CompleteSbtMintDto } from './dto/complete-sbt-mint.dto.js';

type LevelUpRequest = {
  id: string;
  user_id: string;
  target_level: number;
  status: string;
  minted_at: string | null;
};

@Injectable()
export class SbtTokensService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async completeMint(payload: CompleteSbtMintDto) {
    const levelUpRequest = await this.getLevelUpRequest(payload.levelUpRequestId);

    if (levelUpRequest.status === 'minted' || levelUpRequest.minted_at) {
      throw new ConflictException('Level-up request is already minted');
    }

    const mintedAt = payload.mintedAt ?? new Date().toISOString();
    const sbtToken = await this.insertSbtToken(payload, levelUpRequest, mintedAt);
    const updatedLevelUpRequest = await this.markLevelUpRequestMinted(
      levelUpRequest.id,
      payload.tokenId,
      mintedAt
    );

    return {
      sbtToken,
      levelUpRequest: updatedLevelUpRequest
    };
  }

  private async getLevelUpRequest(levelUpRequestId: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('level_up_requests')
      .select('id, user_id, target_level, status, minted_at')
      .eq('id', levelUpRequestId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new NotFoundException(`Level-up request ${levelUpRequestId} was not found`);
    }

    return data as LevelUpRequest;
  }

  private async insertSbtToken(
    payload: CompleteSbtMintDto,
    levelUpRequest: LevelUpRequest,
    mintedAt: string
  ) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('sbt_tokens')
      .insert({
        user_id: levelUpRequest.user_id,
        token_id: payload.tokenId,
        level: levelUpRequest.target_level,
        metadata_uri: payload.metadataUri,
        badge_image_uri: payload.badgeImageUri,
        contract_address: payload.contractAddress,
        transaction_hash: payload.transactionHash,
        minted_at: mintedAt
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  private async markLevelUpRequestMinted(
    levelUpRequestId: string,
    tokenId: string,
    mintedAt: string
  ) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('level_up_requests')
      .update({
        status: 'minted',
        sbt_token_id: tokenId,
        minted_at: mintedAt
      })
      .eq('id', levelUpRequestId)
      .is('minted_at', null)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
}
