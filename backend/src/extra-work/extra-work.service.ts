import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import {
  currentAndNextMonthKstRange,
  kstTimestampNow,
} from '../common/utils/kst-date';
import { CreateExtraWorkRequestDto } from './dto/create-extra-work-request.dto';

@Injectable()
export class ExtraWorkService {
  constructor(private readonly supabase: SupabaseService) {}

  async createRequest(managerId: string, dto: CreateExtraWorkRequestDto) {
    const { data: store, error: storeError } = await this.supabase.client
      .from('stores')
      .select('id, manager_id')
      .eq('id', dto.storeId)
      .single();

    if (storeError || !store) {
      throw new NotFoundException('매장을 찾을 수 없습니다');
    }

    if (store.manager_id !== managerId) {
      throw new ForbiddenException('해당 매장의 추가 근무 요청을 생성할 권한이 없습니다');
    }

    this.assertDateWithinCurrentAndNextMonth(dto.requestedDate);
    this.assertTimeRange(dto.requestedStartTime, dto.requestedEndTime);

    const { data, error } = await this.supabase.client
      .from('extra_work_requests')
      .insert({
        store_id: dto.storeId,
        manager_id: managerId,
        requested_date: dto.requestedDate,
        requested_start_time: dto.requestedStartTime,
        requested_end_time: dto.requestedEndTime,
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async apply(userId: string, requestId: string) {
    const request = await this.getRequest(requestId);
    const assignment = await this.getActiveAssignment(userId, request.store_id);
    await this.assertNoScheduleConflict(
      userId,
      request.requested_date,
      request.requested_start_time,
      request.requested_end_time,
    );

    const { data, error } = await this.supabase.client
      .from('extra_work_applications')
      .insert({
        extra_work_request_id: requestId,
        staff_assignment_id: assignment.id,
        user_id: userId,
        store_id: request.store_id,
        status: 'pending',
        applied_at: kstTimestampNow(),
      })
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new BadRequestException({
          message: '이미 신청한 추가 근무 요청입니다',
          code: 'EXTRA_WORK_ALREADY_APPLIED',
        });
      }

      throw new Error(error.message);
    }

    return data;
  }

  async listRequestsForWorker(userId: string, storeId?: string) {
    const assignments = await this.getActiveAssignments(userId, storeId);
    const storeIds = assignments.map((assignment) => assignment.store_id);

    if (storeIds.length === 0) {
      return [];
    }

    const { fromDate, toDate } = currentAndNextMonthKstRange();
    const { data, error } = await this.supabase.client
      .from('extra_work_requests')
      .select('*')
      .in('store_id', storeIds)
      .gte('requested_date', fromDate)
      .lte('requested_date', toDate)
      .order('requested_date')
      .order('requested_start_time');

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }

  async listMyApplications(userId: string) {
    const { data, error } = await this.supabase.client
      .from('extra_work_applications')
      .select('*, extra_work_requests(*)')
      .eq('user_id', userId)
      .order('applied_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }

  async listStoreApplications(managerId: string, storeId: string) {
    await this.assertStoreManager(storeId, managerId);

    const { data, error } = await this.supabase.client
      .from('extra_work_applications')
      .select('*, extra_work_requests(*)')
      .eq('store_id', storeId)
      .order('applied_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }

  async accept(managerId: string, applicationId: string) {
    const { data: application, error } = await this.supabase.client
      .from('extra_work_applications')
      .select('id, extra_work_request_id, store_id, status')
      .eq('id', applicationId)
      .single();

    if (error || !application) {
      throw new NotFoundException('추가 근무 신청을 찾을 수 없습니다');
    }

    if (application.status !== 'pending') {
      throw new BadRequestException('대기 중인 신청만 수락할 수 있습니다');
    }

    await this.assertNoAcceptedApplication(application.extra_work_request_id);

    const { data: store, error: storeError } = await this.supabase.client
      .from('stores')
      .select('id, manager_id')
      .eq('id', application.store_id)
      .single();

    if (storeError || !store || store.manager_id !== managerId) {
      throw new ForbiddenException('해당 신청을 수락할 권한이 없습니다');
    }

    const { error: rejectError } = await this.supabase.client
      .from('extra_work_applications')
      .update({
        status: 'not_selected',
        responded_at: kstTimestampNow(),
      })
      .eq('extra_work_request_id', application.extra_work_request_id)
      .neq('id', applicationId)
      .eq('status', 'pending');

    if (rejectError) {
      throw new Error(rejectError.message);
    }

    const { data, error: acceptError } = await this.supabase.client
      .from('extra_work_applications')
      .update({
        status: 'accepted',
        responded_at: kstTimestampNow(),
      })
      .eq('id', applicationId)
      .select('*')
      .single();

    if (acceptError) {
      throw new Error(acceptError.message);
    }

    return data;
  }

  private async assertNoAcceptedApplication(requestId: string) {
    const { data, error } = await this.supabase.client
      .from('extra_work_applications')
      .select('id')
      .eq('extra_work_request_id', requestId)
      .eq('status', 'accepted')
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (data) {
      throw new BadRequestException({
        message: '이미 수락된 추가 근무 요청입니다',
        code: 'EXTRA_WORK_ALREADY_ACCEPTED',
      });
    }
  }

  private async getRequest(requestId: string) {
    const { data, error } = await this.supabase.client
      .from('extra_work_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error || !data) {
      throw new NotFoundException('추가 근무 요청을 찾을 수 없습니다');
    }

    return data;
  }

  private async getActiveAssignment(userId: string, storeId: string) {
    const { data, error } = await this.supabase.client
      .from('staff_assignments')
      .select('id')
      .eq('user_id', userId)
      .eq('store_id', storeId)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      throw new ForbiddenException('활성화된 직원 배정이 없습니다');
    }

    return data;
  }

  private async getActiveAssignments(userId: string, storeId?: string) {
    let query = this.supabase.client
      .from('staff_assignments')
      .select('id, store_id')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }

  private async assertStoreManager(storeId: string, managerId: string) {
    const { data, error } = await this.supabase.client
      .from('stores')
      .select('id, manager_id')
      .eq('id', storeId)
      .single();

    if (error || !data) {
      throw new NotFoundException('매장을 찾을 수 없습니다');
    }

    if (data.manager_id !== managerId) {
      throw new ForbiddenException('해당 매장의 추가 근무 신청을 조회할 권한이 없습니다');
    }
  }

  private async assertNoScheduleConflict(
    userId: string,
    date: string,
    startTime: string,
    endTime: string,
  ) {
    const { data, error } = await this.supabase.client
      .from('schedules')
      .select('id, scheduled_start_time, scheduled_end_time')
      .eq('user_id', userId)
      .eq('scheduled_date', date)
      .eq('is_cancelled', false);

    if (error) {
      throw new Error(error.message);
    }

    const hasScheduleConflict = (data ?? []).some((schedule) =>
      this.hasTimeOverlap(
        startTime,
        endTime,
        schedule.scheduled_start_time,
        schedule.scheduled_end_time,
      ),
    );

    if (hasScheduleConflict) {
      throw new BadRequestException({
        message: '기존 스케줄과 시간이 겹칩니다',
        code: 'EXTRA_WORK_SCHEDULE_CONFLICT',
      });
    }
  }

  private assertDateWithinCurrentAndNextMonth(date: string) {
    const { fromDate, toDate } = currentAndNextMonthKstRange();

    if (date < fromDate || date > toDate) {
      throw new BadRequestException('추가 근무 요청은 현재 월과 익월까지만 생성할 수 있습니다');
    }
  }

  private assertTimeRange(startTime: string, endTime: string) {
    if (startTime >= endTime) {
      throw new BadRequestException('종료 시간은 시작 시간보다 늦어야 합니다');
    }
  }

  private hasTimeOverlap(
    startA: string,
    endA: string,
    startB: string,
    endB: string,
  ): boolean {
    return startA < endB && startB < endA;
  }
}
