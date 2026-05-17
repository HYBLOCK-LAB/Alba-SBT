import { Injectable, NotFoundException } from '@nestjs/common';

import { SupabaseService } from '../../common/supabase/supabase.service';

@Injectable()
export class BadgesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async list() {
    const { data, error } = await this.supabaseService
      .client
      .from('badge_images')
      .select('*')
      .order('level', { ascending: true });

    if (error) {
      throw error;
    }

    return data;
  }

  async getByLevel(level: number) {
    const { data, error } = await this.supabaseService
      .client
      .from('badge_images')
      .select('*')
      .eq('level', level)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new NotFoundException(`Badge image for level ${level} was not found`);
    }

    return data;
  }
}
