import { randomBytes } from 'node:crypto';

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { SupabaseService } from '../../infra/supabase/supabase.service.js';
import { CheckLevelUpDto } from './dto/check-level-up.dto.js';

type EasType = 'EAS_EXP_TIME' | 'EAS_FAITH_ATT' | 'EAS_WORK_COMP' | 'EAS_EXTRA_ACC';

type EasAttestation = {
  eas_uid: string;
  eas_type: EasType;
  attestation_data: Record<string, unknown> | null;
  issued_at: string;
};

type SbtToken = {
  id?: string;
  token_id?: string;
  level: number;
  metadata_uri?: string;
  badge_image_uri?: string;
  contract_address?: string;
  transaction_hash?: string;
  minted_at?: string;
  created_at?: string;
};

type LevelUpStatus =
  | 'pending'
  | 'awaiting_approval'
  | 'multisig_signed'
  | 'minted'
  | 'rejected'
  | 'failed';

type LevelUpRequestRecord = {
  id: string;
  user_id: string;
  current_level: number;
  target_level: number;
  status: LevelUpStatus;
  nonce: string;
  used_eas_uids: unknown;
  requirements_snapshot: unknown;
  manager_signature: string | null;
  platform_signature: string | null;
  sbt_token_id: string | null;
  requested_at: string;
  approved_at: string | null;
  minted_at: string | null;
  created_at: string;
};

type BadgeImage = {
  level: number;
  image_uri: string;
  image_filename: string;
  category: string | null;
  description: string | null;
};

type UserRecord = {
  id: string;
  account_type: string;
  name: string;
  wallet_address: string;
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
    const [requests, currentLevel] = await Promise.all([
      this.listLevelUpRequestsByUser(userId),
      this.getCurrentLevel(userId)
    ]);
    const badgeImages = await this.listBadgeImagesByLevels(
      requests.map((request) => request.target_level)
    );
    const history = requests.map((request) =>
      this.toRequestSummary(request, badgeImages.get(request.target_level))
    );

    return {
      userId,
      currentLevel,
      activeRequest: history.find((request) => this.isActiveStatus(request.status)) ?? null,
      latestRequest: history[0] ?? null,
      history
    };
  }

  async getRequestDetail(requestId: string) {
    const request = await this.getLevelUpRequestById(requestId);
    const [worker, badgeImage, sbtToken] = await Promise.all([
      this.getUser(request.user_id),
      this.getBadgeImageByLevel(request.target_level),
      this.getSbtTokenByUserAndLevel(request.user_id, request.target_level)
    ]);

    return {
      request: this.toRequestDetail(request, badgeImage ?? undefined),
      worker: {
        id: worker.id,
        accountType: worker.account_type,
        name: worker.name,
        walletAddress: worker.wallet_address
      },
      badgeImage: badgeImage ? this.toBadgeImageResponse(badgeImage) : null,
      sbtToken: sbtToken ? this.toSbtTokenResponse(sbtToken) : null
    };
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

    const nonce = this.generateUint256Nonce();
    const { data, error } = await this.supabaseService
      .getClient()
      .from('level_up_requests')
      .insert({
        user_id: payload.userId,
        current_level: currentLevel,
        target_level: evaluation.nextEligibleLevel,
        status: 'pending',
        nonce,
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

  private async listLevelUpRequestsByUser(userId: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('level_up_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []) as LevelUpRequestRecord[];
  }

  private async getLevelUpRequestById(requestId: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('level_up_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new NotFoundException(`Level-up request ${requestId} was not found`);
    }

    return data as LevelUpRequestRecord;
  }

  private async getUser(userId: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('users')
      .select('id, account_type, name, wallet_address')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new NotFoundException(`User ${userId} was not found`);
    }

    return data as UserRecord;
  }

  private async getBadgeImageByLevel(level: number) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('badge_images')
      .select('level, image_uri, image_filename, category, description')
      .eq('level', level)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data as BadgeImage | null;
  }

  private async listBadgeImagesByLevels(levels: number[]) {
    const uniqueLevels = Array.from(new Set(levels));
    const badgesByLevel = new Map<number, BadgeImage>();

    if (uniqueLevels.length === 0) {
      return badgesByLevel;
    }

    const { data, error } = await this.supabaseService
      .getClient()
      .from('badge_images')
      .select('level, image_uri, image_filename, category, description')
      .in('level', uniqueLevels);

    if (error) {
      throw error;
    }

    for (const badge of (data ?? []) as BadgeImage[]) {
      badgesByLevel.set(badge.level, badge);
    }

    return badgesByLevel;
  }

  private async getSbtTokenByUserAndLevel(userId: string, level: number) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('sbt_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('level', level)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data as SbtToken | null;
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

  private generateUint256Nonce() {
    return BigInt(`0x${randomBytes(32).toString('hex')}`).toString(10);
  }

  private toRequestSummary(request: LevelUpRequestRecord, badgeImage?: BadgeImage) {
    return {
      id: request.id,
      userId: request.user_id,
      currentLevel: request.current_level,
      targetLevel: request.target_level,
      status: request.status,
      badgeImageUri: badgeImage?.image_uri ?? null,
      sbtTokenId: request.sbt_token_id,
      requestedAt: request.requested_at,
      approvedAt: request.approved_at,
      mintedAt: request.minted_at,
      createdAt: request.created_at,
      nextAction: this.getNextAction(request.status)
    };
  }

  private toRequestDetail(request: LevelUpRequestRecord, badgeImage?: BadgeImage) {
    return {
      ...this.toRequestSummary(request, badgeImage),
      nonce: request.nonce,
      signatures: {
        manager: request.manager_signature,
        platform: request.platform_signature
      },
      evidence: {
        easUids: this.getStringArray(request.used_eas_uids),
        requirementsSnapshot: request.requirements_snapshot
      }
    };
  }

  private toBadgeImageResponse(badgeImage: BadgeImage) {
    return {
      level: badgeImage.level,
      imageUri: badgeImage.image_uri,
      imageFilename: badgeImage.image_filename,
      category: badgeImage.category,
      description: badgeImage.description
    };
  }

  private toSbtTokenResponse(sbtToken: SbtToken) {
    return {
      id: sbtToken.id,
      tokenId: sbtToken.token_id,
      level: sbtToken.level,
      metadataUri: sbtToken.metadata_uri,
      badgeImageUri: sbtToken.badge_image_uri,
      contractAddress: sbtToken.contract_address,
      transactionHash: sbtToken.transaction_hash,
      mintedAt: sbtToken.minted_at,
      createdAt: sbtToken.created_at
    };
  }

  private getStringArray(value: unknown) {
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : [];
  }

  private isActiveStatus(status: LevelUpStatus) {
    return status === 'pending' || status === 'awaiting_approval' || status === 'multisig_signed';
  }

  private getNextAction(status: LevelUpStatus) {
    const actions: Record<LevelUpStatus, string> = {
      pending: 'manager_approval_required',
      awaiting_approval: 'manager_approval_required',
      multisig_signed: 'mint_pending',
      minted: 'completed',
      rejected: 'rejected',
      failed: 'retry_required'
    };

    return actions[status];
  }
}
