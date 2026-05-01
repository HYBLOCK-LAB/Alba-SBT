import { Injectable } from '@nestjs/common';

import { SupabaseService } from '../../infra/supabase/supabase.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getByWalletAddress(walletAddress: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  async create(payload: CreateUserDto) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('users')
      .insert({
        account_type: payload.accountType,
        name: payload.name,
        email: payload.email ?? null,
        phone: payload.phone ?? null,
        wallet_address: payload.walletAddress
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
}
