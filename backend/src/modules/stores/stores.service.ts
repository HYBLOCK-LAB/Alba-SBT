import { ConflictException, Injectable } from '@nestjs/common';

import { SupabaseService } from '../../infra/supabase/supabase.service.js';
import { CreateStoreDto } from './dto/create-store.dto.js';

@Injectable()
export class StoresService {
  private readonly storeCodeMaxAttempts = 10;

  constructor(private readonly supabaseService: SupabaseService) {}

  async listByManager(managerId: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('stores')
      .select('*')
      .eq('manager_id', managerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  }

  async getByStoreCode(storeCode: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('stores')
      .select('*')
      .eq('store_code', storeCode)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  async create(payload: CreateStoreDto) {
    for (let attempt = 0; attempt < this.storeCodeMaxAttempts; attempt += 1) {
      const storeCode = await this.generateUniqueStoreCode();
      const { data, error } = await this.supabaseService
        .getClient()
        .from('stores')
        .insert({
          manager_id: payload.managerId,
          name: payload.name,
          store_code: storeCode,
          category: payload.category,
          sub_category: payload.subCategory,
          address: payload.address,
          latitude: payload.latitude,
          longitude: payload.longitude,
          gps_radius_meters: payload.gpsRadiusMeters ?? 50,
          qr_validity_start_hour: payload.qrValidityStartHour,
          qr_validity_end_hour: payload.qrValidityEndHour,
          business_number: payload.businessNumber ?? null,
          contact: payload.contact ?? null
        })
        .select('*')
        .single();

      if (!error) {
        return data;
      }

      if (!this.isStoreCodeConflict(error)) {
        throw error;
      }
    }

    throw new ConflictException('Failed to create a store with a unique store code');
  }

  private async generateUniqueStoreCode() {
    for (let attempt = 0; attempt < this.storeCodeMaxAttempts; attempt += 1) {
      const candidate = this.generateStoreCode();
      const { data, error } = await this.supabaseService
        .getClient()
        .from('stores')
        .select('id')
        .eq('store_code', candidate)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return candidate;
      }
    }

    throw new ConflictException('Failed to generate a unique store code');
  }

  private generateStoreCode() {
    return Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, '0');
  }

  private isStoreCodeConflict(error: { code?: string; message?: string; details?: string }) {
    const message = `${error.message ?? ''} ${error.details ?? ''}`;
    return error.code === '23505' && message.includes('store_code');
  }
}
