import { Injectable } from '@nestjs/common';

import { SupabaseService } from '../../infra/supabase/supabase.service.js';
import { CreateLevelUpRequestDto } from './dto/create-level-up-request.dto.js';

@Injectable()
export class LevelUpService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getStatus(userId: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('level_up_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  }

  async createRequest(payload: CreateLevelUpRequestDto) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('level_up_requests')
      .insert({
        user_id: payload.userId,
        current_level: payload.currentLevel,
        target_level: payload.targetLevel,
        status: 'pending',
        nonce: payload.nonce,
        requested_at: payload.requestedAt ?? new Date().toISOString()
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
}
