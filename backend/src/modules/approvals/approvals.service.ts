import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common';
import {
  Contract,
  Interface,
  JsonRpcProvider,
  TypedDataDomain,
  Wallet,
  ZeroAddress,
  getAddress,
  verifyTypedData
} from 'ethers';

import { SupabaseService } from '../../infra/supabase/supabase.service.js';
import { AuthenticatedUser } from '../auth/auth.types.js';
import { SbtMetadataService } from '../sbt-metadata/sbt-metadata.service.js';
import { SbtTokensService } from '../sbt-tokens/sbt-tokens.service.js';
import { SignApprovalDto } from './dto/sign-approval.dto.js';

type LevelUpStatus =
  | 'pending'
  | 'awaiting_approval'
  | 'multisig_signed'
  | 'minted'
  | 'rejected'
  | 'failed';

type LevelUpRequest = {
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

type UserRecord = {
  id: string;
  account_type: string;
  name: string;
  wallet_address: string;
};

type StoreRecord = {
  id: string;
  manager_id: string;
  name: string;
};

type StaffAssignment = {
  id: string;
  user_id: string;
  store_id: string;
  approved_at: string;
  created_at: string;
};

type ApprovalContext = {
  request: LevelUpRequest;
  worker: UserRecord;
  assignment: StaffAssignment;
  store: StoreRecord;
  manager: UserRecord;
};

type TxLog = {
  topics: readonly string[];
  data: string;
};

const LEVEL_UP_TYPES = {
  LevelUp: [
    { name: 'worker', type: 'address' },
    { name: 'level', type: 'uint8' },
    { name: 'nonce', type: 'uint256' }
  ]
};

const APPROVE_LEVEL_UP_ABI = [
  'function approveLevelUp(address worker,uint8 level,uint256 nonce,bytes sig1,bytes sig2,string tokenURI) returns (uint256)',
  'event Transfer(address indexed from,address indexed to,uint256 indexed tokenId)'
];

const SBT_INTERFACE = new Interface(APPROVE_LEVEL_UP_ABI);

@Injectable()
export class ApprovalsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly sbtMetadataService: SbtMetadataService,
    private readonly sbtTokensService: SbtTokensService
  ) {}

  async listPendingForManager(user: AuthenticatedUser) {
    this.assertManager(user);

    const { data, error } = await this.supabaseService
      .getClient()
      .from('level_up_requests')
      .select('*')
      .in('status', ['pending', 'awaiting_approval'])
      .order('requested_at', { ascending: true });

    if (error) {
      throw error;
    }

    const pending = [];

    for (const request of (data ?? []) as LevelUpRequest[]) {
      const context = await this.getApprovalContext(request);

      if (this.isCurrentManager(context.manager, user)) {
        pending.push(this.toPendingApproval(context));
      }
    }

    return { approvals: pending };
  }

  async getSigningPayload(requestId: string, user: AuthenticatedUser) {
    this.assertManager(user);

    const request = await this.getLevelUpRequestById(requestId);
    const context = await this.getApprovalContext(request);
    this.assertApprovingManager(context, user);

    return {
      request: this.toRequestResponse(context.request),
      worker: this.toUserResponse(context.worker),
      approver: this.toApproverResponse(context),
      typedData: this.buildTypedData(context)
    };
  }

  async signAndMint(payload: SignApprovalDto, user: AuthenticatedUser) {
    this.assertManager(user);

    const sig1 = payload.managerSignature ?? payload.sig1;

    if (!sig1) {
      throw new BadRequestException('managerSignature or sig1 is required');
    }

    this.assertSignature(sig1, 'managerSignature');

    const request = await this.findRequestFromPayload(payload);
    const context = await this.getApprovalContext(request);
    this.assertApprovingManager(context, user);
    this.assertPayloadMatchesRequest(payload, context);
    this.assertRequestIsSignable(context.request);
    this.verifyManagerSignature(context, sig1);

    const metadataUpload = await this.sbtMetadataService.uploadForLevelUpRequest(context.request.id);
    const sig2 = await this.signPlatformTypedData(context);

    await this.markMultisigSigned(context.request.id, sig1, sig2);

    let mintResult: Awaited<ReturnType<typeof this.callApproveLevelUp>>;

    try {
      mintResult = await this.callApproveLevelUp(context, sig1, sig2, metadataUpload.publicUrl);
    } catch (error) {
      await this.markFailed(context.request.id);
      throw error;
    }

    const badgeImageUri = this.getMetadataImage(metadataUpload.metadata);
    const completed = await this.sbtTokensService.completeMint({
      levelUpRequestId: context.request.id,
      tokenId: mintResult.tokenId,
      metadataUri: metadataUpload.publicUrl,
      badgeImageUri,
      contractAddress: this.getContractAddress(),
      transactionHash: mintResult.transactionHash,
      mintedAt: mintResult.mintedAt
    });

    return {
      request: completed.levelUpRequest,
      sbtToken: completed.sbtToken,
      approver: this.toApproverResponse(context),
      signatures: {
        managerSignature: sig1,
        platformSignature: sig2
      },
      metadata: {
        uri: metadataUpload.publicUrl,
        bucket: metadataUpload.bucket,
        path: metadataUpload.path
      },
      transactionHash: mintResult.transactionHash
    };
  }

  private async findRequestFromPayload(payload: SignApprovalDto) {
    if (payload.levelUpRequestId) {
      return this.getLevelUpRequestById(payload.levelUpRequestId);
    }

    if (!payload.workerAddress || !payload.level || !payload.nonce) {
      throw new BadRequestException(
        'levelUpRequestId or workerAddress, level, and nonce are required'
      );
    }

    const worker = await this.getUserByWalletAddress(payload.workerAddress);
    const { data, error } = await this.supabaseService
      .getClient()
      .from('level_up_requests')
      .select('*')
      .eq('user_id', worker.id)
      .eq('target_level', payload.level)
      .eq('nonce', payload.nonce)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new NotFoundException('Matching level-up request was not found');
    }

    return data as LevelUpRequest;
  }

  private async getApprovalContext(request: LevelUpRequest): Promise<ApprovalContext> {
    const worker = await this.getUserById(request.user_id);
    const assignment = await this.getPrimaryAssignment(request.user_id);
    const store = await this.getStoreById(assignment.store_id);
    const manager = await this.getUserById(store.manager_id);

    return { request, worker, assignment, store, manager };
  }

  private async getPrimaryAssignment(userId: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('staff_assignments')
      .select('id, user_id, store_id, approved_at, created_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .is('ended_at', null)
      .order('approved_at', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new NotFoundException(`Active staff assignment for user ${userId} was not found`);
    }

    return data as StaffAssignment;
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

    return data as LevelUpRequest;
  }

  private async getUserById(userId: string) {
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

  private async getUserByWalletAddress(walletAddress: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('users')
      .select('id, account_type, name, wallet_address')
      .ilike('wallet_address', walletAddress)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new NotFoundException(`User with wallet ${walletAddress} was not found`);
    }

    return data as UserRecord;
  }

  private async getStoreById(storeId: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('stores')
      .select('id, manager_id, name')
      .eq('id', storeId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new NotFoundException(`Store ${storeId} was not found`);
    }

    return data as StoreRecord;
  }

  private async markMultisigSigned(requestId: string, sig1: string, sig2: string) {
    const { error } = await this.supabaseService
      .getClient()
      .from('level_up_requests')
      .update({
        status: 'multisig_signed',
        manager_signature: sig1,
        platform_signature: sig2,
        approved_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) {
      throw error;
    }
  }

  private async markFailed(requestId: string) {
    const { error } = await this.supabaseService
      .getClient()
      .from('level_up_requests')
      .update({ status: 'failed' })
      .eq('id', requestId);

    if (error) {
      throw error;
    }
  }

  private assertManager(user: AuthenticatedUser) {
    if (user.accountType !== 'manager') {
      throw new ForbiddenException('Only managers can approve level-up requests');
    }
  }

  private assertApprovingManager(context: ApprovalContext, user: AuthenticatedUser) {
    if (!this.isCurrentManager(context.manager, user)) {
      throw new ForbiddenException('Only the primary store manager can approve this request');
    }
  }

  private assertPayloadMatchesRequest(payload: SignApprovalDto, context: ApprovalContext) {
    if (payload.workerAddress && this.normalizeAddress(payload.workerAddress) !== this.normalizeAddress(context.worker.wallet_address)) {
      throw new BadRequestException('workerAddress does not match the level-up request');
    }

    if (payload.level && payload.level !== context.request.target_level) {
      throw new BadRequestException('level does not match the level-up request');
    }

    if (payload.nonce && payload.nonce !== context.request.nonce) {
      throw new BadRequestException('nonce does not match the level-up request');
    }
  }

  private assertRequestIsSignable(request: LevelUpRequest) {
    if (request.status !== 'pending' && request.status !== 'awaiting_approval') {
      throw new ConflictException(`Level-up request is not signable in ${request.status} status`);
    }
  }

  private assertSignature(signature: string, fieldName: string) {
    if (!/^0x[0-9a-fA-F]{130}$/.test(signature)) {
      throw new BadRequestException(`${fieldName} must be a 65-byte hex signature`);
    }
  }

  private verifyManagerSignature(context: ApprovalContext, sig1: string) {
    const recoveredAddress = verifyTypedData(
      this.buildDomain(),
      LEVEL_UP_TYPES,
      this.buildTypedDataMessage(context),
      sig1
    );

    if (this.normalizeAddress(recoveredAddress) !== this.normalizeAddress(context.manager.wallet_address)) {
      throw new ForbiddenException('managerSignature was not signed by the approving manager');
    }
  }

  private async signPlatformTypedData(context: ApprovalContext) {
    const privateKey = process.env.PLATFORM_SIGNER_PRIVATE_KEY;

    if (!privateKey) {
      throw new BadRequestException('PLATFORM_SIGNER_PRIVATE_KEY is not configured');
    }

    const wallet = new Wallet(privateKey);

    return wallet.signTypedData(
      this.buildDomain(),
      LEVEL_UP_TYPES,
      this.buildTypedDataMessage(context)
    );
  }

  private async callApproveLevelUp(
    context: ApprovalContext,
    sig1: string,
    sig2: string,
    tokenURI: string
  ) {
    const rpcUrl = process.env.SEPOLIA_RPC_URL ?? process.env.RPC_URL ?? process.env.ETHEREUM_RPC_URL;

    if (!rpcUrl) {
      throw new BadRequestException('SEPOLIA_RPC_URL is not configured');
    }

    const signer = new Wallet(process.env.PLATFORM_SIGNER_PRIVATE_KEY ?? '', new JsonRpcProvider(rpcUrl));
    const contract = new Contract(this.getContractAddress(), APPROVE_LEVEL_UP_ABI, signer);
    const args = [
      context.worker.wallet_address,
      context.request.target_level,
      BigInt(context.request.nonce),
      sig1,
      sig2,
      tokenURI
    ] as const;
    let tokenId: string | null = null;

    try {
      const staticTokenId = await contract.approveLevelUp.staticCall(...args);
      tokenId = staticTokenId?.toString() ?? null;
    } catch {
      tokenId = null;
    }

    const transaction = await contract.approveLevelUp(...args);
    const receipt = await transaction.wait();

    if (!receipt) {
      throw new InternalServerErrorException('approveLevelUp transaction did not return a receipt');
    }

    tokenId ??= this.extractTokenId(receipt.logs as readonly TxLog[], context.worker.wallet_address);

    if (!tokenId) {
      throw new InternalServerErrorException('Token id could not be read from approveLevelUp result');
    }

    return {
      tokenId,
      transactionHash: receipt.hash,
      mintedAt: new Date().toISOString()
    };
  }

  private extractTokenId(logs: readonly TxLog[], workerAddress: string) {
    for (const log of logs) {
      try {
        const parsed = SBT_INTERFACE.parseLog({ topics: [...log.topics], data: log.data });

        if (
          parsed?.name === 'Transfer' &&
          this.normalizeAddress(String(parsed.args.from)) === this.normalizeAddress(ZeroAddress) &&
          this.normalizeAddress(String(parsed.args.to)) === this.normalizeAddress(workerAddress)
        ) {
          return parsed.args.tokenId.toString();
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  private buildTypedData(context: ApprovalContext) {
    return {
      domain: this.buildDomain(),
      types: LEVEL_UP_TYPES,
      primaryType: 'LevelUp',
      message: this.buildTypedDataMessage(context)
    };
  }

  private buildDomain(): TypedDataDomain {
    return {
      name: process.env.EIP712_NAME ?? 'AlbaSBT',
      version: process.env.EIP712_VERSION ?? '1',
      chainId: Number(process.env.SBT_CONTRACT_CHAIN_ID ?? 11155111),
      verifyingContract: this.getContractAddress()
    };
  }

  private buildTypedDataMessage(context: ApprovalContext) {
    return {
      worker: context.worker.wallet_address,
      level: context.request.target_level,
      nonce: BigInt(context.request.nonce)
    };
  }

  private getContractAddress() {
    const contractAddress = process.env.SBT_CONTRACT_ADDRESS;

    if (!contractAddress) {
      throw new BadRequestException('SBT_CONTRACT_ADDRESS is not configured');
    }

    return getAddress(contractAddress);
  }

  private getMetadataImage(metadata: unknown) {
    if (
      metadata &&
      typeof metadata === 'object' &&
      'image' in metadata &&
      typeof metadata.image === 'string'
    ) {
      return metadata.image;
    }

    throw new InternalServerErrorException('Metadata image URL is missing');
  }

  private isCurrentManager(manager: UserRecord, user: AuthenticatedUser) {
    return (
      manager.id === user.sub ||
      this.normalizeAddress(manager.wallet_address) === this.normalizeAddress(user.walletAddress)
    );
  }

  private normalizeAddress(value: string) {
    return getAddress(value);
  }

  private toPendingApproval(context: ApprovalContext) {
    return {
      request: this.toRequestResponse(context.request),
      worker: this.toUserResponse(context.worker),
      approver: this.toApproverResponse(context),
      typedData: this.buildTypedData(context)
    };
  }

  private toRequestResponse(request: LevelUpRequest) {
    return {
      id: request.id,
      userId: request.user_id,
      currentLevel: request.current_level,
      targetLevel: request.target_level,
      status: request.status,
      nonce: request.nonce,
      requestedAt: request.requested_at,
      approvedAt: request.approved_at,
      mintedAt: request.minted_at
    };
  }

  private toUserResponse(user: UserRecord) {
    return {
      id: user.id,
      accountType: user.account_type,
      name: user.name,
      walletAddress: user.wallet_address
    };
  }

  private toApproverResponse(context: ApprovalContext) {
    return {
      managerId: context.manager.id,
      managerWalletAddress: context.manager.wallet_address,
      storeId: context.store.id,
      storeName: context.store.name,
      staffAssignmentId: context.assignment.id
    };
  }
}
