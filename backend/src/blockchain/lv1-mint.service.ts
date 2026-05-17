import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Contract, Interface, JsonRpcProvider, Wallet, getAddress } from 'ethers';
import { AppLogger } from '../common/logging/app-logger.service';
import { SupabaseService } from '../common/supabase/supabase.service';
import { kstTimestampNow } from '../common/utils/kst-date';

const ALBA_SBT_ABI = [
  'function mintInitialLevel(address worker, string metadataURI) external returns (uint256 tokenId)',
  'event InitialLevelMinted(address indexed worker, uint8 level, uint256 tokenId, string tokenURI)',
] as const;

interface MintInitialLevelParams {
  userId: string;
  walletAddress: string;
}

interface LevelOneBadgeRow {
  image_uri: string;
}

interface SbtTokenInsertRow {
  user_id: string;
  token_id: string;
  level: number;
  metadata_uri: string;
  badge_image_uri: string;
  contract_address: string;
  transaction_hash: string;
  minted_at: string;
}

export interface Lv1InitialMintResult {
  status: 'minted' | 'failed';
  level: 1;
  tokenId: string | null;
  txHash: string | null;
  metadataUri: string | null;
  badgeImageUri: string | null;
  reason: string | null;
}

@Injectable()
export class Lv1MintService {
  private readonly contractInterface = new Interface(ALBA_SBT_ABI);

  constructor(
    private readonly configService: ConfigService,
    private readonly supabase: SupabaseService,
    private readonly logger: AppLogger,
  ) {}

  async mintForSignup(params: MintInitialLevelParams): Promise<Lv1InitialMintResult> {
    const worker = getAddress(params.walletAddress);
    const contractAddress = this.getRequiredConfig('ALBA_SBT_CONTRACT_ADDRESS');
    let txHash: string | null = null;
    let tokenId: string | null = null;
    let metadataUri: string | null = null;
    let badgeImageUri: string | null = null;

    try {
      badgeImageUri = await this.resolveLevelOneBadgeImageUri();
      const mintedAt = this.toKstIsoOffsetString();
      metadataUri = this.buildMetadataUri({
        badgeImageUri,
        mintedAt,
      });

      const contract = this.createContract();
      const tx = await contract.mintInitialLevel(worker, metadataUri);
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error('민팅 영수증을 확인하지 못했습니다');
      }

      txHash = receipt.hash;
      tokenId = this.extractTokenId(receipt.logs, worker);
      const mintedTokenId = tokenId!;
      const mintedTxHash = txHash!;
      await this.insertSbtToken({
        user_id: params.userId,
        token_id: mintedTokenId,
        level: 1,
        metadata_uri: metadataUri,
        badge_image_uri: badgeImageUri,
        contract_address: contractAddress,
        transaction_hash: mintedTxHash,
        minted_at: mintedAt,
      });

      this.logger.log(`Lv.1 자동 민팅 완료: userId=${params.userId}, tokenId=${tokenId}`, 'Lv1MintService');

      return {
        status: 'minted',
        level: 1,
        tokenId: mintedTokenId,
        txHash: mintedTxHash,
        metadataUri,
        badgeImageUri,
        reason: null,
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(
        `Lv.1 자동 민팅 실패: userId=${params.userId}, wallet=${worker}, reason=${reason}`,
        error instanceof Error ? error.stack : undefined,
        'Lv1MintService',
      );

      return {
        status: 'failed',
        level: 1,
        tokenId,
        txHash,
        metadataUri,
        badgeImageUri,
        reason,
      };
    }
  }

  private createContract() {
    const rpcUrl = this.getRequiredConfig('SEPOLIA_RPC_URL');
    const privateKey = this.getRequiredConfig('PLATFORM_SIGNER_PRIVATE_KEY');
    const contractAddress = this.getRequiredConfig('ALBA_SBT_CONTRACT_ADDRESS');
    const provider = new JsonRpcProvider(rpcUrl);
    const wallet = new Wallet(privateKey, provider);

    const configuredSigner = this.configService.get<string>('PLATFORM_SIGNER_ADDRESS');
    if (configuredSigner && getAddress(configuredSigner) !== wallet.address) {
      throw new Error('PLATFORM_SIGNER_PRIVATE_KEY와 PLATFORM_SIGNER_ADDRESS가 일치하지 않습니다');
    }

    return new Contract(contractAddress, ALBA_SBT_ABI, wallet);
  }

  private async resolveLevelOneBadgeImageUri() {
    const { data, error } = await this.supabase.client
      .from('badge_images')
      .select('image_uri')
      .eq('level', 1)
      .maybeSingle<LevelOneBadgeRow>();

    if (error) {
      throw new Error(`Lv.1 뱃지 이미지 조회에 실패했습니다: ${error.message}`);
    }

    if (data?.image_uri) {
      return data.image_uri;
    }

    const fallbackImageUri = this.configService.get<string>('LV1_BADGE_IMAGE_URI');
    if (fallbackImageUri) {
      return fallbackImageUri;
    }

    throw new Error('Lv.1 뱃지 이미지가 badge_images 테이블 또는 LV1_BADGE_IMAGE_URI에 없습니다');
  }

  private buildMetadataUri(params: { badgeImageUri: string; mintedAt: string }) {
    const metadata = {
      name: 'AlbaSBT Lv.1',
      description: 'Verified part-time career badge',
      image: params.badgeImageUri,
      attributes: [
        { trait_type: 'Level', value: 1 },
        { trait_type: 'Issued At', value: params.mintedAt },
      ],
      evidence: {
        eas_uids: [] as string[],
      },
    };

    const encoded = Buffer.from(JSON.stringify(metadata)).toString('base64');
    return `data:application/json;base64,${encoded}`;
  }

  private extractTokenId(logs: readonly unknown[], worker: string) {
    for (const rawLog of logs) {
      if (!rawLog || typeof rawLog !== 'object') {
        continue;
      }

      try {
        const parsed = this.contractInterface.parseLog(rawLog as Parameters<Interface['parseLog']>[0]);
        if (!parsed || parsed.name !== 'InitialLevelMinted') {
          continue;
        }

        const eventWorker = getAddress(String(parsed.args.worker));
        if (eventWorker !== worker) {
          continue;
        }

        return parsed.args.tokenId.toString();
      } catch {
        continue;
      }
    }

    throw new Error('InitialLevelMinted 이벤트에서 tokenId를 추출하지 못했습니다');
  }

  private async insertSbtToken(row: SbtTokenInsertRow) {
    const { error } = await this.supabase.client.from('sbt_tokens').insert(row);

    if (error) {
      throw new Error(`sbt_tokens 기록에 실패했습니다: ${error.message}`);
    }
  }

  private getRequiredConfig(key: string) {
    return this.configService.getOrThrow<string>(key);
  }

  private toKstIsoOffsetString() {
    return `${kstTimestampNow()}+09:00`;
  }
}
