import { Injectable } from '@nestjs/common';

import { SupabaseService } from '../../common/supabase/supabase.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getByWalletAddress(walletAddress: string) {
    const { data, error } = await this.supabaseService
      .client
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
      .client
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
