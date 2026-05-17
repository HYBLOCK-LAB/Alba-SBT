import { Injectable } from '@nestjs/common';

import { SupabaseService } from '../../common/supabase/supabase.service';

@Injectable()
export class CareerReportService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getReport(userId: string) {
    const [user, currentLevel, attestations, assignments, attendanceStats, extraWorkCount] =
      await Promise.all([
        this.getUser(userId),
        this.getCurrentLevel(userId),
        this.getIssuedAttestations(userId),
        this.getStaffAssignments(userId),
        this.getAttendanceStats(userId),
        this.getExtraWorkCount(userId),
      ]);

    const workHistory = assignments.map((a: any) => ({
      storeId: a.store_id,
      storeName: a.store?.name ?? '알 수 없음',
      category: a.store?.category ?? null,
      subCategory: a.store?.sub_category ?? null,
      startDate: a.approved_at ?? a.created_at,
      endDate: a.ended_at ?? null,
      status: a.status,
    }));

    const easItems = attestations.map((att: any) => ({
      easType: att.eas_type,
      storeName: att.attestation_data?.store_name ?? null,
      category: att.attestation_data?.category ?? null,
      description: this.buildEasDescription(att.eas_type, att.attestation_data),
      issuedAt: att.issued_at,
      easUid: att.eas_uid,
    }));

    const tenureMonths = this.computeTenureMonths(assignments);

    return {
      userId,
      name: user?.name ?? '알 수 없음',
      currentLevel,
      stats: {
        tenureMonths,
        attendancePct: attendanceStats.pct,
        extraWorkCount,
      },
      easAttestations: easItems,
      workHistory,
    };
  }

  private async getUser(userId: string) {
    const { data } = await this.supabaseService.client
      .from('users')
      .select('id, name')
      .eq('id', userId)
      .maybeSingle();
    return data;
  }

  private async getCurrentLevel(userId: string) {
    const { data } = await this.supabaseService.client
      .from('sbt_tokens')
      .select('level')
      .eq('user_id', userId)
      .order('level', { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as any)?.level ?? 1;
  }

  private async getIssuedAttestations(userId: string) {
    const { data, error } = await this.supabaseService.client
      .from('eas_attestations')
      .select('eas_type, attestation_data, issued_at, eas_uid')
      .eq('user_id', userId)
      .eq('status', 'issued')
      .order('issued_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  private async getStaffAssignments(userId: string) {
    const { data, error } = await this.supabaseService.client
      .from('staff_assignments')
      .select('*, store:stores(name, category, sub_category)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  private async getAttendanceStats(userId: string) {
    const { data, error } = await this.supabaseService.client
      .from('attendance')
      .select('status')
      .eq('user_id', userId);
    if (error) return { pct: null };

    const records = data ?? [];
    if (records.length === 0) return { pct: null };

    const present = records.filter((r: any) =>
      r.status === 'normal' || r.status === 'late'
    ).length;
    const pct = Math.round((present / records.length) * 100);
    return { pct };
  }

  private async getExtraWorkCount(userId: string) {
    const { count, error } = await this.supabaseService.client
      .from('extra_work_applications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'accepted');
    if (error) return 0;
    return count ?? 0;
  }

  private computeTenureMonths(assignments: any[]) {
    const active = assignments.filter((a: any) => a.status === 'active' && a.approved_at);
    if (active.length === 0) return 0;

    const earliest = active.reduce((min: any, a: any) =>
      new Date(a.approved_at) < new Date(min.approved_at) ? a : min
    );

    const start = new Date(earliest.approved_at);
    const now = new Date();
    const months =
      (now.getFullYear() - start.getFullYear()) * 12 +
      (now.getMonth() - start.getMonth());
    return Math.max(0, months);
  }

  private buildEasDescription(easType: string, data: Record<string, unknown> | null): string {
    if (!data) return easType;
    const storeName = (data.store_name as string) ?? '';
    switch (easType) {
      case 'EAS_EXP_TIME':
        return storeName ? `${storeName} · 6개월 근속` : '6개월 근속 증명';
      case 'EAS_FAITH_ATT':
        return storeName ? `${storeName} · 90일 성실 인증` : '90일 성실 인증';
      case 'EAS_WORK_COMP':
        return storeName ? `${storeName} · 업무 완수 인증` : '업무 완수 인증';
      case 'EAS_EXTRA_ACC':
        return `추가근무 ${(data.total_accepted_count as number) ?? ''}회 수락 인증`;
      default:
        return easType;
    }
  }
}
