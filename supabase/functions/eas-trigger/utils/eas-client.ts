import { ethers } from "ethers";

// EAS 스키마 문자열 (EAS-Schema.md 기준)
export const EAS_SCHEMAS = {
  EAS_EXP_TIME:
    "bytes32 storeId, string storeName, string category, string subCategory, uint32 periodMonths, uint64 startDate, uint64 endDate",
  EAS_FAITH_ATT:
    "bytes32 storeId, string storeName, string category, string subCategory, uint32 absentCount, uint32 lateCount, uint32 periodDays, uint64 startDate, uint64 endDate",
  EAS_WORK_COMP:
    "bytes32 storeId, string storeName, string category, string subCategory, uint32 completedCount, uint32 onTimeCount, uint32 periodDays, uint64 startDate, uint64 endDate",
  EAS_EXTRA_ACC:
    "uint32 totalAcceptedCount, uint64 issuedDate, bytes extraStoresData",
} as const;

export type EasType = keyof typeof EAS_SCHEMAS;

// EAS 컨트랙트 ABI (attest 함수 + Attested 이벤트만 포함)
// Sepolia EAS 공식 컨트랙트: https://docs.attest.org/docs/quick--start/contracts
const EAS_ABI = [
  "function attest((bytes32 schema, (address recipient, uint64 expirationTime, bool revocable, bytes32 refUID, bytes data, uint256 value) data) request) payable returns (bytes32)",
  "event Attested(address indexed recipient, address indexed attester, bytes32 uid, bytes32 indexed schemaUID)",
];

let _contract: ethers.Contract | null = null;
let _signer: ethers.Wallet | null = null;

// EAS 컨트랙트 인스턴스 및 signer 초기화 (싱글톤)
export function getEasClient(): { contract: ethers.Contract; signer: ethers.Wallet } {
  if (_contract && _signer) return { contract: _contract, signer: _signer };

  const privateKey = Deno.env.get("PLATFORM_SIGNER_PRIVATE_KEY");
  const easContractAddress = Deno.env.get("EAS_CONTRACT_ADDRESS");

  if (!privateKey || !easContractAddress) {
    throw new Error("PLATFORM_SIGNER_PRIVATE_KEY 또는 EAS_CONTRACT_ADDRESS 환경변수 미설정");
  }

  const rpcUrl = Deno.env.get("SEPOLIA_RPC_URL") ?? "https://ethereum-sepolia-rpc.publicnode.com";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  _signer = new ethers.Wallet(privateKey, provider);
  _contract = new ethers.Contract(easContractAddress, EAS_ABI, _signer);

  return { contract: _contract, signer: _signer };
}

// EAS SDK의 SchemaEncoder를 ethers ABI 인코딩으로 대체
// 동일한 encodeData() API를 유지하여 각 핸들러 코드 변경 없음
export class SchemaEncoder {
  encodeData(fields: Array<{ name: string; value: unknown; type: string }>): string {
    const types = fields.map((f) => f.type);
    const values = fields.map((f) => f.value);
    return ethers.AbiCoder.defaultAbiCoder().encode(types, values);
  }
}

// EAS 타입별 SchemaEncoder 생성 (기존 핸들러 호환 API 유지)
export function getSchemaEncoder(_easType: EasType): SchemaEncoder {
  return new SchemaEncoder();
}

// UUID → bytes32 변환 (16바이트 UUID를 32바이트로 우측 패딩)
export function uuidToBytes32(uuid: string): string {
  const hex = uuid.replace(/-/g, "");
  return "0x" + hex.padEnd(64, "0");
}

// "YYYY-MM-DD" → Unix timestamp (초, uint64용 bigint)
export function dateToUnixTimestamp(dateStr: string): bigint {
  return BigInt(Math.floor(new Date(dateStr).getTime() / 1000));
}
