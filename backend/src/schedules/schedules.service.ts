import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { nextMonthKstRange, todayKstDate } from '../common/utils/kst-date';
import { GenerateSchedulesDto } from './dto/generate-schedules.dto';

interface RecurringSchedulePattern {
  id: string;
  staff_assignment_id: string;
  store_id: string;
  user_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  effective_from: string;
}

@Injectable()
export class SchedulesService {
  constructor(private readonly supabase: SupabaseService) {}

  async generateFromRecurringPattern(dto: GenerateSchedulesDto, managerId?: string) {
    if (managerId) {
      await this.assertManagerCanGenerate(dto.staffAssignmentId, managerId);
    }

    const { data: patterns, error } = await this.supabase.client
      .from('recurring_schedules')
      .select('*')
      .eq('staff_assignment_id', dto.staffAssignmentId)
      .eq('is_active', true);

    if (error) {
      throw new Error(error.message);
    }

    const rows = [];
    const from = new Date(`${dto.fromDate}T00:00:00.000Z`);
    const to = new Date(`${dto.toDate}T00:00:00.000Z`);

    for (const pattern of (patterns ?? []) as RecurringSchedulePattern[]) {
      if (dto.recurringScheduleId && pattern.id !== dto.recurringScheduleId) {
        continue;
      }

      for (const date = new Date(from); date <= to; date.setUTCDate(date.getUTCDate() + 1)) {
        if (date.getUTCDay() !== pattern.day_of_week) {
          continue;
        }

        const scheduledDate = date.toISOString().slice(0, 10);
        if (scheduledDate < pattern.effective_from) {
          continue;
        }

        const { data: existing, error: existingError } = await this.supabase.client
          .from('schedules')
          .select('id')
          .eq('staff_assignment_id', pattern.staff_assignment_id)
          .eq('scheduled_date', scheduledDate)
          .maybeSingle();

        if (existingError) {
          throw new Error(existingError.message);
        }

        if (existing) {
          continue;
        }

        rows.push({
          staff_assignment_id: pattern.staff_assignment_id,
          store_id: pattern.store_id,
          user_id: pattern.user_id,
          scheduled_date: scheduledDate,
          scheduled_start_time: pattern.start_time,
          scheduled_end_time: pattern.end_time,
          is_cancelled: false,
        });
      }
    }

    if (rows.length === 0) {
      return { inserted: 0 };
    }

    const { error: insertError } = await this.supabase.client.from('schedules').insert(rows);
    if (insertError) {
      throw new Error(insertError.message);
    }

    return { inserted: rows.length };
  }

  async generateCurrentAndNextMonthForAssignment(staffAssignmentId: string, managerId: string) {
    await this.assertManagerCanGenerate(staffAssignmentId, managerId);

    const today = todayKstDate();
    const now = new Date(`${today}T00:00:00.000Z`);
    const lastDayNextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 2, 0));

    return this.generateFromRecurringPattern({
      staffAssignmentId,
      fromDate: today,
      toDate: lastDayNextMonth.toISOString().slice(0, 10),
    });
  }

  async generateNextMonthForAllActivePatterns() {
    const { fromDate, toDate } = nextMonthKstRange();

    const { data: assignmentIds, error } = await this.supabase.client
      .from('recurring_schedules')
      .select('staff_assignment_id')
      .eq('is_active', true);

    if (error) {
      throw new Error(error.message);
    }

    const uniqueAssignmentIds = [
      ...new Set((assignmentIds ?? []).map((row) => row.staff_assignment_id)),
    ];

    let inserted = 0;
    for (const staffAssignmentId of uniqueAssignmentIds) {
      const result = await this.generateFromRecurringPattern({
        staffAssignmentId,
        fromDate,
        toDate,
      });
      inserted += result.inserted;
    }

    return { inserted };
  }

  private async assertManagerCanGenerate(staffAssignmentId: string, managerId: string) {
    const { data: assignment, error } = await this.supabase.client
      .from('staff_assignments')
      .select('id, store_id, stores!inner(id, manager_id)')
      .eq('id', staffAssignmentId)
      .single();

    if (error || !assignment) {
      throw new NotFoundException('직원 배정을 찾을 수 없습니다');
    }

    const store = Array.isArray(assignment.stores) ? assignment.stores[0] : assignment.stores;
    if (!store || store.manager_id !== managerId) {
      throw new ForbiddenException('해당 직원의 스케줄을 생성할 권한이 없습니다');
    }
  }
}
