# Alba-SBT Level-Up Multisig Operational Flow

## Scope

This document explains the operational flow between developer C and developer B-2 for Lv.2+ level-up minting.

## Flow Summary

Level-up minting uses:

- issued EAS as off-chain evidence
- B-2 level detection
- manager signature from C-owned signing flow
- platform signature from B-2
- `approveLevelUp(...)` contract call

## Source Data

### Evidence Source

- table: `eas_attestations`
- valid evidence condition: `status = 'issued'`
- fixed EAS types:
  - `EAS_EXP_TIME`
  - `EAS_FAITH_ATT`
  - `EAS_WORK_COMP`
  - `EAS_EXTRA_ACC`

### Level-Up Request Store

- table: `level_up_requests`
- key fields:
  - `user_id`
  - `current_level`
  - `target_level`
  - `status`
  - `nonce`
  - `manager_signature`
  - `platform_signature`
  - `sbt_token_id`

## Detailed Flow

### 1. Level Detection

B-2 reads issued EAS evidence and determines that a worker satisfies the next level condition.

Expected DB write:

- insert or update `level_up_requests`
- set:
  - `current_level`
  - `target_level`
  - `status = 'awaiting_approval'`

## 2. Nonce Issuance

B-2 issues a nonce for that worker.

Rule:

- nonce is scoped per worker address
- on-chain type: `uint256`
- API and DB transport: string

### Suggested API Response

```json
{
  "workerAddress": "0xabc...",
  "level": 4,
  "nonce": "12"
}
```

## 3. Manager Signature Collection

C-owned signing service asks the manager wallet to sign this EIP-712 payload:

```text
LevelApproval(address worker,uint8 level,uint256 nonce)
```

Payload values:

- `worker`
- `level`
- `nonce`

Not included in signature payload:

- `tokenURI`
- `requestId`

## 4. C -> B-2 Approval Submission

C sends the signed manager approval to B-2.

### Suggested Request

```json
{
  "workerAddress": "0xabc...",
  "level": 4,
  "nonce": "12",
  "sig1": "0x..."
}
```

## 5. Platform Signature And tokenURI Assembly

B-2 performs:

- manager signature storage
- platform signature generation using same payload
- metadata JSON assembly
- tokenURI generation

### tokenURI Metadata Minimum Shape

```json
{
  "name": "AlbaSBT Lv.4",
  "description": "Verified part-time career badge",
  "image": "https://<storage>/badge-images/level-4.png",
  "attributes": [
    { "trait_type": "Level", "value": 4 },
    { "trait_type": "Issued At", "value": "2026-05-06T00:00:00+09:00" }
  ],
  "evidence": {
    "eas_uids": ["0x123...", "0x456..."]
  }
}
```

## 6. Contract Call

B-2 calls:

```solidity
approveLevelUp(
    address worker,
    uint8 level,
    uint256 nonce,
    bytes sig1,
    bytes sig2,
    string tokenURI
)
```

Contract validates:

- nonce match
- level increase
- manager authorization
- platform signature

## 7. Success Handling

If mint succeeds, B-2 updates:

### `level_up_requests`

- `status = 'minted'`
- `platform_signature`
- `sbt_token_id`
- `minted_at`

### `sbt_tokens`

- `token_id`
- `level`
- `metadata_uri`
- `badge_image_uri`
- `contract_address`
- `transaction_hash`
- `minted_at`

### Suggested Response Back To C

```json
{
  "txHash": "0x...",
  "tokenId": "42",
  "level": 4
}
```

## 8. Failure Handling

### Rejected Case

Meaning:

- manager explicitly refuses approval

Expected DB update:

- `level_up_requests.status = 'rejected'`

### Failed Case

Meaning:

- signature validation failed
- nonce mismatch
- tokenURI assembly failed
- contract call reverted

Expected DB update:

- `level_up_requests.status = 'failed'`

## Retry Rule

- B-2 should issue a fresh nonce on retry
- previous `sig1` becomes invalid for the new retry cycle
- C must request a new manager signature for the new nonce

## Ownership Split

### Developer C

- defines EIP-712 payload and signing domain
- provides signing UX/service for manager signature
- provides contract ABI and deployment details

### Developer B-2

- level detection
- nonce issuance
- platform signature creation
- metadata assembly and storage
- contract invocation
- DB persistence after mint

