import { Injectable } from '@nestjs/common';

import { SupabaseService } from '../../infra/supabase/supabase.service.js';
import { CreateStoreDto } from './dto/create-store.dto.js';

@Injectable()
export class StoresService {
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
    const { data, error } = await this.supabaseService
      .getClient()
      .from('stores')
      .insert({
        manager_id: payload.managerId,
        name: payload.name,
        store_code: payload.storeCode,
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

    if (error) {
      throw error;
    }

    return data;
  }
}
