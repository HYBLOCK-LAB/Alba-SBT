import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { SupabaseService } from '../../infra/supabase/supabase.service.js';
import { CompleteSbtMintDto } from './dto/complete-sbt-mint.dto.js';

@Injectable()
export class SbtTokensService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async completeMint(payload: CompleteSbtMintDto) {
    const { data, error } = await this.supabaseService
      .getClient()
      .rpc('complete_sbt_mint', {
        p_level_up_request_id: payload.levelUpRequestId,
        p_token_id: payload.tokenId,
        p_metadata_uri: payload.metadataUri,
        p_badge_image_uri: payload.badgeImageUri,
        p_contract_address: payload.contractAddress,
        p_transaction_hash: payload.transactionHash,
        p_minted_at: payload.mintedAt ?? null
      });

    if (error) {
      this.throwMappedMintError(error, payload.levelUpRequestId);
    }

    return data;
  }

  private throwMappedMintError(
    error: { code?: string; message?: string },
    levelUpRequestId: string
  ): never {
    if (error.code === 'P0002' || error.message?.includes('level_up_request_not_found')) {
      throw new NotFoundException(`Level-up request ${levelUpRequestId} was not found`);
    }

    if (
      error.code === '23505' ||
      error.code === 'P0001' ||
      error.message?.includes('level_up_request_already_minted') ||
      error.message?.includes('level_up_request_not_mintable')
    ) {
      throw new ConflictException(error.message);
    }

    throw error;
  }
}
