import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  readonly client: SupabaseClient;

  constructor(configService: ConfigService) {
    const url = this.normalizeSupabaseUrl(configService.getOrThrow<string>('SUPABASE_URL'));
    const serviceRoleKey = configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');

    this.client = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  private normalizeSupabaseUrl(url: string) {
    return url.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  }
}
