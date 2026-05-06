import { ConflictException, Injectable } from '@nestjs/common';

import { SupabaseService } from '../../infra/supabase/supabase.service.js';
import { CheckLevelUpDto } from './dto/check-level-up.dto.js';
import { CreateLevelUpRequestDto } from './dto/create-level-up-request.dto.js';

type EasType = 'EAS_EXP_TIME' | 'EAS_FAITH_ATT' | 'EAS_WORK_COMP' | 'EAS_EXTRA_ACC';

type EasAttestation = {
  eas_uid: string;
  eas_type: EasType;
  attestation_data: Record<string, unknown> | null;
  issued_at: string;
};

type SbtToken = {
  level: number;
};

type LevelRequirement = {
  level: number;
  easCounts: Partial<Record<EasType, number>>;
  expCategoryCount?: number;
};

const LEVEL_REQUIREMENTS: LevelRequirement[] = [
  { level: 2, easCounts: { EAS_EXP_TIME: 1 } },
  {
    level: 3,
    easCounts: { EAS_EXP_TIME: 2, EAS_FAITH_ATT: 2, EAS_WORK_COMP: 1 }
  },
  {
    level: 4,
    easCounts: { EAS_EXP_TIME: 3, EAS_FAITH_ATT: 3, EAS_WORK_COMP: 2 }
  },
  {
    level: 5,
    easCounts: { EAS_EXP_TIME: 4, EAS_FAITH_ATT: 5, EAS_WORK_COMP: 4 },
    expCategoryCount: 2
  },
  {
    level: 6,
    easCounts: { EAS_EXP_TIME: 4, EAS_FAITH_ATT: 6, EAS_WORK_COMP: 5 }
  },
  {
    level: 7,
    easCounts: { EAS_EXP_TIME: 5, EAS_FAITH_ATT: 8, EAS_WORK_COMP: 7 }
  },
  {
    level: 8,
    easCounts: {
      EAS_EXP_TIME: 6,
      EAS_FAITH_ATT: 10,
      EAS_WORK_COMP: 9,
      EAS_EXTRA_ACC: 1
    },
    expCategoryCount: 3
  },
  {
    level: 9,
    easCounts: {
      EAS_EXP_TIME: 7,
      EAS_FAITH_ATT: 12,
      EAS_WORK_COMP: 11,
      EAS_EXTRA_ACC: 2
    }
  },
  {
    level: 10,
    easCounts: {
      EAS_EXP_TIME: 8,
      EAS_FAITH_ATT: 15,
      EAS_WORK_COMP: 14,
      EAS_EXTRA_ACC: 3
    },
    expCategoryCount: 4
  }
];

@Injectable()
export class LevelUpService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getStatus(userId: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('level_up_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  }

  async createRequest(payload: CreateLevelUpRequestDto) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('level_up_requests')
      .insert({
        user_id: payload.userId,
        current_level: payload.currentLevel,
        target_level: payload.targetLevel,
        status: 'pending',
        nonce: payload.nonce,
        requested_at: payload.requestedAt ?? new Date().toISOString()
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async checkLevelUp(payload: CheckLevelUpDto) {
    const [issuedEas, currentLevel] = await Promise.all([
      this.listIssuedEas(payload.userId),
      this.getCurrentLevel(payload.userId)
    ]);

    const evaluation = this.evaluateEligibleLevel(issuedEas, currentLevel);

    if (!evaluation.nextEligibleLevel) {
      return {
        userId: payload.userId,
        currentLevel,
        nextEligibleLevel: null,
        requestCreated: false,
        reason: 'requirements_not_met',
        requirementsSnapshot: evaluation.requirementsSnapshot,
        usedEasUids: []
      };
    }

    const duplicateRequest = await this.findLevelUpRequest(
      payload.userId,
      evaluation.nextEligibleLevel
    );

    if (duplicateRequest) {
      return {
        userId: payload.userId,
        currentLevel,
        nextEligibleLevel: evaluation.nextEligibleLevel,
        requestCreated: false,
        reason: 'request_already_exists',
        existingRequest: duplicateRequest,
        requirementsSnapshot: evaluation.requirementsSnapshot,
        usedEasUids: evaluation.usedEasUids
      };
    }

    if (payload.nonce === undefined) {
      return {
        userId: payload.userId,
        currentLevel,
        nextEligibleLevel: evaluation.nextEligibleLevel,
        requestCreated: false,
        reason: 'nonce_required',
        requirementsSnapshot: evaluation.requirementsSnapshot,
        usedEasUids: evaluation.usedEasUids
      };
    }

    const { data, error } = await this.supabaseService
      .getClient()
      .from('level_up_requests')
      .insert({
        user_id: payload.userId,
        current_level: currentLevel,
        target_level: evaluation.nextEligibleLevel,
        status: 'pending',
        nonce: payload.nonce,
        used_eas_uids: evaluation.usedEasUids,
        requirements_snapshot: evaluation.requirementsSnapshot,
        requested_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return {
      userId: payload.userId,
      currentLevel,
      nextEligibleLevel: evaluation.nextEligibleLevel,
      requestCreated: true,
      request: data,
      requirementsSnapshot: evaluation.requirementsSnapshot,
      usedEasUids: evaluation.usedEasUids
    };
  }

  private async listIssuedEas(userId: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('eas_attestations')
      .select('eas_uid, eas_type, attestation_data, issued_at')
      .eq('user_id', userId)
      .eq('status', 'issued')
      .order('issued_at', { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []) as EasAttestation[];
  }

  private async getCurrentLevel(userId: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('sbt_tokens')
      .select('level')
      .eq('user_id', userId)
      .order('level', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return ((data as SbtToken | null)?.level ?? 1);
  }

  private async findLevelUpRequest(userId: string, targetLevel: number) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('level_up_requests')
      .select('*')
      .eq('user_id', userId)
      .eq('target_level', targetLevel)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  private evaluateEligibleLevel(issuedEas: EasAttestation[], currentLevel: number) {
    const counts = this.countEasByType(issuedEas);
    const expCategories = this.getExpCategories(issuedEas);
    let nextEligibleLevel: number | null = null;
    let matchedRequirement: LevelRequirement | null = null;

    for (const requirement of LEVEL_REQUIREMENTS) {
      if (requirement.level <= currentLevel) {
        continue;
      }

      if (this.matchesRequirement(requirement, counts, expCategories)) {
        nextEligibleLevel = requirement.level;
        matchedRequirement = requirement;
        break;
      }
    }

    const usedEasUids = matchedRequirement
      ? this.selectUsedEasUids(issuedEas, matchedRequirement)
      : [];

    return {
      nextEligibleLevel,
      usedEasUids,
      requirementsSnapshot: {
        source: 'PRD',
        evaluatedAt: new Date().toISOString(),
        currentLevel,
        easCounts: counts,
        expCategoryCount: expCategories.size,
        matchedRequirement
      }
    };
  }

  private countEasByType(issuedEas: EasAttestation[]) {
    const counts: Record<EasType, number> = {
      EAS_EXP_TIME: 0,
      EAS_FAITH_ATT: 0,
      EAS_WORK_COMP: 0,
      EAS_EXTRA_ACC: 0
    };

    for (const eas of issuedEas) {
      counts[eas.eas_type] += 1;
    }

    return counts;
  }

  private getExpCategories(issuedEas: EasAttestation[]) {
    const categories = new Set<string>();

    for (const eas of issuedEas) {
      if (eas.eas_type !== 'EAS_EXP_TIME') {
        continue;
      }

      const category = eas.attestation_data?.category;
      if (typeof category === 'string' && category.trim()) {
        categories.add(category);
      }
    }

    return categories;
  }

  private matchesRequirement(
    requirement: LevelRequirement,
    counts: Record<EasType, number>,
    expCategories: Set<string>
  ) {
    for (const [easType, requiredCount] of Object.entries(requirement.easCounts)) {
      if (counts[easType as EasType] < requiredCount) {
        return false;
      }
    }

    return !requirement.expCategoryCount || expCategories.size >= requirement.expCategoryCount;
  }

  private selectUsedEasUids(issuedEas: EasAttestation[], requirement: LevelRequirement) {
    const usedUids: string[] = [];

    for (const [easType, requiredCount] of Object.entries(requirement.easCounts)) {
      const matchingUids =
        easType === 'EAS_EXP_TIME'
          ? this.selectExpTimeUids(issuedEas, requiredCount, requirement.expCategoryCount)
          : issuedEas
              .filter((eas) => eas.eas_type === easType)
              .slice(0, requiredCount)
              .map((eas) => eas.eas_uid);

      if (matchingUids.length < requiredCount) {
        throw new ConflictException(`Not enough issued attestations for ${easType}`);
      }

      usedUids.push(...matchingUids);
    }

    return usedUids;
  }

  private selectExpTimeUids(
    issuedEas: EasAttestation[],
    requiredCount: number,
    requiredCategoryCount = 0
  ) {
    const expAttestations = issuedEas.filter((eas) => eas.eas_type === 'EAS_EXP_TIME');
    const selected = new Map<string, EasAttestation>();
    const selectedCategories = new Set<string>();

    for (const eas of expAttestations) {
      const category = eas.attestation_data?.category;
      if (
        typeof category === 'string' &&
        category.trim() &&
        !selectedCategories.has(category) &&
        selectedCategories.size < requiredCategoryCount
      ) {
        selected.set(eas.eas_uid, eas);
        selectedCategories.add(category);
      }
    }

    for (const eas of expAttestations) {
      if (selected.size >= requiredCount) {
        break;
      }

      selected.set(eas.eas_uid, eas);
    }

    return Array.from(selected.values()).map((eas) => eas.eas_uid);
  }
}
