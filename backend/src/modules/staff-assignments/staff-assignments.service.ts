import { Injectable } from '@nestjs/common';

import { SupabaseService } from '../../common/supabase/supabase.service';
import { ApproveStaffAssignmentDto } from './dto/approve-staff-assignment.dto';
import { CreateStaffAssignmentDto } from './dto/create-staff-assignment.dto';

@Injectable()
export class StaffAssignmentsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async listByUser(userId: string) {
    const { data, error } = await this.supabaseService.client
      .from('staff_assignments')
      .select('*, store:stores(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async listByStore(storeId: string) {
    const { data, error } = await this.supabaseService
      .client
      .from('staff_assignments')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  }

  async create(payload: CreateStaffAssignmentDto) {
    const { data, error } = await this.supabaseService
      .client
      .from('staff_assignments')
      .insert({
        user_id: payload.userId,
        store_id: payload.storeId,
        staff_number: payload.staffNumber,
        status: 'pending'
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async approve(assignmentId: string, payload: ApproveStaffAssignmentDto) {
    const { data, error } = await this.supabaseService
      .client
      .from('staff_assignments')
      .update({
        status: 'active',
        approved_at: payload.approvedAt ?? new Date().toISOString(),
        ended_at: null
      })
      .eq('id', assignmentId)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
}
