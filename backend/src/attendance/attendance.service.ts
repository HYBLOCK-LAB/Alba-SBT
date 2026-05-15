import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { getDistanceMeters } from '../common/utils/distance';
import {
  currentKstTime,
  kstTimestampNow,
  todayKstDate,
  yesterdayKstDate,
} from '../common/utils/kst-date';
import { QrService } from '../qr/qr.service';
import { AttendanceMonthQueryDto } from './dto/attendance-month-query.dto';
import { ClockInDto } from './dto/clock-in.dto';
import { ClockOutDto } from './dto/clock-out.dto';

type AttendanceStatus = 'on_time' | 'late' | 'absent';
type WorkType = 'regular' | 'extra';

interface StoreGps {
  latitude: number;
  longitude: number;
  gps_radius_meters: number;
}

interface WorkTarget {
  type: WorkType;
  status: AttendanceStatus;
  scheduleId: string | null;
  extraWorkApplicationId: string | null;
}

interface TodaySchedule {
  id: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
}

interface ScheduledWork {
  id: string;
  staff_assignment_id: string;
  store_id: string;
  user_id: string;
  scheduled_date: string;
  scheduled_start_time: string;
}

interface ScheduleAttendance {
  id: string;
  clock_in_time: string | null;
  status: AttendanceStatus;
}

interface AcceptedExtraWorkApplication {
  id: string;
  extra_work_request_id: string;
  extra_work_requests: {
    requested_date: string;
    requested_start_time: string;
    requested_end_time: string;
  };
}

@Injectable()
export class AttendanceService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly qrService: QrService,
  ) {}

  async clockIn(userId: string, dto: ClockInDto) {
    const store = await this.getStore(dto.storeId);
    await this.assertQrAndGps(dto.qrToken, dto.storeId, dto.latitude, dto.longitude, store);

    const assignment = await this.getActiveAssignment(userId, dto.storeId);
    const schedule = await this.findTodaySchedule(assignment.id, userId, dto.storeId);
    const extraWorkApplication = schedule
      ? null
      : await this.findTodayAcceptedExtraWorkApplication(userId, dto.storeId);
    const workTarget = this.resolveWorkTarget(schedule, extraWorkApplication);
    await this.assertNoActiveAttendance(userId, dto.storeId);
    await this.assertNoDuplicateAttendance(workTarget);

    const { data, error } = await this.supabase.client
      .from('attendance')
      .insert({
        staff_assignment_id: assignment.id,
        user_id: userId,
        store_id: dto.storeId,
        schedule_id: workTarget.scheduleId,
        type: workTarget.type,
        status: workTarget.status,
        clock_in_time: kstTimestampNow(),
        extra_work_application_id: workTarget.extraWorkApplicationId,
        clock_in_latitude: dto.latitude,
        clock_in_longitude: dto.longitude,
        clock_in_gps_verified: true,
        clock_in_qr_scanned: dto.qrToken,
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async clockOut(userId: string, dto: ClockOutDto) {
    const attendance = dto.attendanceId
      ? await this.getAttendanceById(dto.attendanceId)
      : await this.getOpenAttendance(userId, dto.storeId);

    if (attendance.user_id !== userId) {
      throw new ForbiddenException('본인의 출근 기록만 퇴근 처리할 수 있습니다');
    }

    if (attendance.store_id !== dto.storeId) {
      throw new BadRequestException({
        message: '출근 기록과 매장이 일치하지 않습니다',
        code: 'ATTENDANCE_STORE_MISMATCH',
      });
    }

    if (attendance.clock_out_time) {
      throw new BadRequestException('이미 퇴근 처리된 기록입니다');
    }

    const store = await this.getStore(attendance.store_id);
    await this.assertQrAndGps(
      dto.qrToken,
      attendance.store_id,
      dto.latitude,
      dto.longitude,
      store,
    );

    const { data, error } = await this.supabase.client
      .from('attendance')
      .update({
        clock_out_time: kstTimestampNow(),
        clock_out_latitude: dto.latitude,
        clock_out_longitude: dto.longitude,
        clock_out_gps_verified: true,
        clock_out_qr_scanned: dto.qrToken,
      })
      .eq('id', attendance.id)
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async getMyMonthlyAttendance(userId: string, query: AttendanceMonthQueryDto) {
    const { fromDate, toDateExclusive } = this.getMonthRange(query.month);

    let schedulesQuery = this.supabase.client
      .from('schedules')
      .select('*')
      .eq('user_id', userId)
      .gte('scheduled_date', fromDate)
      .lt('scheduled_date', toDateExclusive)
      .order('scheduled_date');

    let attendanceQuery = this.supabase.client
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', `${fromDate}T00:00:00`)
      .lt('created_at', `${toDateExclusive}T00:00:00`)
      .order('created_at');

    if (query.storeId) {
      schedulesQuery = schedulesQuery.eq('store_id', query.storeId);
      attendanceQuery = attendanceQuery.eq('store_id', query.storeId);
    }

    const [{ data: schedules, error: schedulesError }, { data: attendance, error }] =
      await Promise.all([schedulesQuery, attendanceQuery]);

    if (schedulesError) {
      throw new Error(schedulesError.message);
    }

    if (error) {
      throw new Error(error.message);
    }

    return {
      month: query.month,
      schedules: schedules ?? [],
      attendance: attendance ?? [],
    };
  }

  async getStoreTodayStatus(managerId: string, storeId: string) {
    await this.assertStoreManager(storeId, managerId);

    const today = todayKstDate();
    const [{ data: schedules, error: schedulesError }, { data: attendance, error }] =
      await Promise.all([
        this.supabase.client
          .from('schedules')
          .select('*')
          .eq('store_id', storeId)
          .eq('scheduled_date', today)
          .eq('is_cancelled', false)
          .order('scheduled_start_time'),
        this.supabase.client
          .from('attendance')
          .select('*')
          .eq('store_id', storeId)
          .gte('created_at', `${today}T00:00:00`)
          .lt('created_at', `${today}T23:59:59`)
          .order('created_at'),
      ]);

    if (schedulesError) {
      throw new Error(schedulesError.message);
    }

    if (error) {
      throw new Error(error.message);
    }

    return {
      date: today,
      schedules: schedules ?? [],
      attendance: attendance ?? [],
    };
  }

  async judgeAttendanceForYesterday() {
    const date = yesterdayKstDate();
    return this.judgeAttendanceForDate(date);
  }

  async judgeAttendanceForDate(date: string) {
    const { data: schedules, error } = await this.supabase.client
      .from('schedules')
      .select('id, staff_assignment_id, store_id, user_id, scheduled_date, scheduled_start_time')
      .eq('scheduled_date', date)
      .eq('is_cancelled', false);

    if (error) {
      throw new Error(error.message);
    }

    let insertedAbsent = 0;
    let updatedStatus = 0;

    for (const schedule of (schedules ?? []) as ScheduledWork[]) {
      const attendance = await this.findAttendanceByScheduleId(schedule.id);

      if (!attendance) {
        await this.insertAbsentAttendance(schedule);
        insertedAbsent += 1;
        continue;
      }

      const nextStatus = this.judgeScheduledAttendanceStatus(schedule, attendance.clock_in_time);
      if (attendance.status === nextStatus) {
        continue;
      }

      await this.updateAttendanceStatus(attendance.id, nextStatus);
      updatedStatus += 1;
    }

    return {
      date,
      checked: schedules?.length ?? 0,
      insertedAbsent,
      updatedStatus,
    };
  }

  private async findAttendanceByScheduleId(scheduleId: string): Promise<ScheduleAttendance | null> {
    const { data, error } = await this.supabase.client
      .from('attendance')
      .select('id, clock_in_time, status')
      .eq('schedule_id', scheduleId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  private async insertAbsentAttendance(schedule: ScheduledWork) {
    const { error } = await this.supabase.client.from('attendance').insert({
      staff_assignment_id: schedule.staff_assignment_id,
      user_id: schedule.user_id,
      store_id: schedule.store_id,
      schedule_id: schedule.id,
      type: 'regular',
      status: 'absent',
      clock_in_time: null,
      clock_in_gps_verified: false,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  private async updateAttendanceStatus(attendanceId: string, status: AttendanceStatus) {
    const { error } = await this.supabase.client
      .from('attendance')
      .update({ status })
      .eq('id', attendanceId);

    if (error) {
      throw new Error(error.message);
    }
  }

  private judgeScheduledAttendanceStatus(
    schedule: Pick<ScheduledWork, 'scheduled_date' | 'scheduled_start_time'>,
    clockInTime: string | null,
  ): AttendanceStatus {
    if (!clockInTime) {
      return 'absent';
    }

    const clockIn = new Date(clockInTime);
    const scheduledStart = this.toKstDateTime(schedule.scheduled_date, schedule.scheduled_start_time);

    if (clockIn.getTime() <= scheduledStart.getTime()) {
      return 'on_time';
    }

    const lateLimit = scheduledStart.getTime() + 30 * 60 * 1000;
    return clockIn.getTime() <= lateLimit ? 'late' : 'absent';
  }

  private toKstDateTime(date: string, time: string): Date {
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes, seconds = 0] = time.split(':').map(Number);
    return new Date(Date.UTC(year, month - 1, day, hours - 9, minutes, seconds));
  }

  private async getAttendanceById(attendanceId: string) {
    const { data, error } = await this.supabase.client
      .from('attendance')
      .select('id, user_id, store_id, clock_out_time')
      .eq('id', attendanceId)
      .single();

    if (error || !data) {
      throw new NotFoundException('출근 기록을 찾을 수 없습니다');
    }

    return data;
  }

  private async getOpenAttendance(userId: string, storeId: string) {
    const { data, error } = await this.supabase.client
      .from('attendance')
      .select('id, user_id, store_id, clock_out_time')
      .eq('user_id', userId)
      .eq('store_id', storeId)
      .is('clock_out_time', null)
      .not('clock_in_time', 'is', null)
      .order('clock_in_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new NotFoundException('퇴근 처리할 출근 기록이 없습니다');
    }

    return data;
  }

  private async assertNoActiveAttendance(userId: string, storeId: string) {
    const { data, error } = await this.supabase.client
      .from('attendance')
      .select('id')
      .eq('user_id', userId)
      .eq('store_id', storeId)
      .is('clock_out_time', null)
      .not('clock_in_time', 'is', null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (data) {
      throw new BadRequestException({
        message: '이미 출근 처리된 근무가 있습니다',
        code: 'ATTENDANCE_ALREADY_OPEN',
      });
    }
  }

  private async assertNoDuplicateAttendance(workTarget: WorkTarget) {
    const column = workTarget.scheduleId ? 'schedule_id' : 'extra_work_application_id';
    const value = workTarget.scheduleId ?? workTarget.extraWorkApplicationId;

    const { data, error } = await this.supabase.client
      .from('attendance')
      .select('id')
      .eq(column, value)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (data) {
      throw new BadRequestException({
        message: '이미 처리된 근무 기록입니다',
        code: 'ATTENDANCE_ALREADY_EXISTS',
      });
    }
  }

  private async assertQrAndGps(
    qrToken: string,
    storeId: string,
    latitude: number,
    longitude: number,
    store: StoreGps,
  ) {
    const token = await this.qrService.verifyToken(qrToken);
    if (!token || token.store_id !== storeId) {
      throw new BadRequestException({
        message: '위치/QR이 일치하지 않습니다',
        code: 'QR_TOKEN_INVALID',
      });
    }

    const distance = getDistanceMeters(
      { latitude, longitude },
      { latitude: Number(store.latitude), longitude: Number(store.longitude) },
    );

    if (distance > Number(store.gps_radius_meters ?? 50)) {
      throw new BadRequestException({
        message: '위치/QR이 일치하지 않습니다',
        code: 'GPS_OUT_OF_RANGE',
      });
    }
  }

  private async getStore(storeId: string) {
    const { data, error } = await this.supabase.client
      .from('stores')
      .select('id, latitude, longitude, gps_radius_meters')
      .eq('id', storeId)
      .single();

    if (error || !data) {
      throw new NotFoundException('매장을 찾을 수 없습니다');
    }

    return data;
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
      throw new ForbiddenException('해당 매장의 근태 현황을 조회할 권한이 없습니다');
    }
  }

  private async getActiveAssignment(userId: string, storeId: string) {
    const { data, error } = await this.supabase.client
      .from('staff_assignments')
      .select('id, user_id, store_id')
      .eq('user_id', userId)
      .eq('store_id', storeId)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      throw new ForbiddenException('활성화된 직원 배정이 없습니다');
    }

    return data;
  }

  private async findTodaySchedule(
    assignmentId: string,
    userId: string,
    storeId: string,
  ): Promise<TodaySchedule | null> {
    const today = todayKstDate();
    const { data, error } = await this.supabase.client
      .from('schedules')
      .select('id, scheduled_start_time, scheduled_end_time')
      .eq('staff_assignment_id', assignmentId)
      .eq('user_id', userId)
      .eq('store_id', storeId)
      .eq('scheduled_date', today)
      .eq('is_cancelled', false)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  private async findTodayAcceptedExtraWorkApplication(
    userId: string,
    storeId: string,
  ): Promise<AcceptedExtraWorkApplication | null> {
    const { data, error } = await this.supabase.client
      .from('extra_work_applications')
      .select(
        `
        id,
        extra_work_request_id,
        extra_work_requests!inner (
          requested_date,
          requested_start_time,
          requested_end_time
        )
      `,
      )
      .eq('user_id', userId)
      .eq('store_id', storeId)
      .eq('status', 'accepted')
      .eq('extra_work_requests.requested_date', todayKstDate())
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data as AcceptedExtraWorkApplication | null;
  }

  private resolveWorkTarget(
    schedule: TodaySchedule | null,
    extraWorkApplication: AcceptedExtraWorkApplication | null,
  ): WorkTarget {
    if (schedule) {
      return {
        type: 'regular',
        status: this.judgeClockInStatus(currentKstTime(), schedule.scheduled_start_time),
        scheduleId: schedule.id,
        extraWorkApplicationId: null,
      };
    }

    if (extraWorkApplication) {
      return {
        type: 'extra',
        status: this.judgeClockInStatus(
          currentKstTime(),
          extraWorkApplication.extra_work_requests.requested_start_time,
        ),
        scheduleId: null,
        extraWorkApplicationId: extraWorkApplication.id,
      };
    }

    throw new BadRequestException({
      message: '오늘 근무 예정이 없습니다',
      code: 'NO_WORK_SCHEDULE_TODAY',
    });
  }

  private judgeClockInStatus(nowTime: string, scheduledStartTime: string): AttendanceStatus {
    if (nowTime <= scheduledStartTime) {
      return 'on_time';
    }

    const nowMinutes = this.toMinutes(nowTime);
    const scheduledMinutes = this.toMinutes(scheduledStartTime);
    return nowMinutes <= scheduledMinutes + 30 ? 'late' : 'absent';
  }

  private toMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private getMonthRange(month: string) {
    const from = new Date(`${month}-01T00:00:00.000Z`);
    const to = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1));

    return {
      fromDate: from.toISOString().slice(0, 10),
      toDateExclusive: to.toISOString().slice(0, 10),
    };
  }
}
