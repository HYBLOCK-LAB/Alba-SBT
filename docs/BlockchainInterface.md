# Alba-SBT Blockchain Interface Draft

## Scope

This document captures the interfaces developer C can finalize independently before backend and frontend integration.

## EIP-712 Level-Up Payload

Level-up approval uses a minimal payload.

```text
LevelApproval(address worker,uint8 level,uint256 nonce)
```

- `worker`: worker wallet address receiving the SBT
- `level`: target level to mint
- `nonce`: worker-address-scoped replay protection value

### Domain

```json
{
  "name": "AlbaSBT",
  "version": "1",
  "chainId": 11155111,
  "verifyingContract": "<deployed_contract_address>"
}
```

### Notes

- `tokenURI` is not part of the signed payload.
- `tokenURI` is passed only as a contract function argument at mint time.
- `requestId` is not used for signature verification.
- Replay protection is handled by `nonce` only.

## Multisig Mint Function

```solidity
approveLevelUp(
    address worker,
    uint8 level,
    uint256 nonce,
    bytes managerSig,
    bytes platformSig,
    string tokenURI
)
```

### Nonce Policy

- Contract type: `uint256`
- API and DB transport: string
- Semantics: nonce is scoped per worker address

## Minting Flows

### Lv.1 Initial Mint

- Trigger: SIWE login + signup completion
- Signer: platform only
- Multisig: not required
- Contract path: `mintInitialLevel(worker, tokenURI)`

### Lv.2+ Level-Up Mint

- Trigger: off-chain level detection based on issued EAS
- Signers: manager + platform
- Multisig: required
- Contract path: `approveLevelUp(...)`

## tokenURI Metadata Shape

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
    "eas_uids": [
      "0x1234...",
      "0xabcd..."
    ]
  }
}
```

### Required Fields

- `name`
- `description`
- `image`
- `attributes`
- `evidence.eas_uids`

### Metadata Expectations

- `level` must be represented in `name` or `attributes`
- badge image URI must be stored in `image`
- used EAS UIDs must be stored in `evidence.eas_uids`
- `issued_at` should be included in `attributes`

## DB Alignment

### `level_up_requests`

- `nonce`: store and transport as string, cast to `uint256` before signing and contract call
- `status`:
  - `pending`
  - `awaiting_approval`
  - `multisig_signed`
  - `minted`
  - `rejected`
  - `failed`

### `sbt_tokens`

- `token_id`: on-chain token id
- `metadata_uri`: final tokenURI used during mint
- `contract_address`: deployed SBT contract address
- `transaction_hash`: mint transaction hash

### `eas_attestations`

- only `status = 'issued'` attestations are valid level-up evidence
- EAS types are fixed as:
  - `EAS_EXP_TIME`
  - `EAS_FAITH_ATT`
  - `EAS_WORK_COMP`
  - `EAS_EXTRA_ACC`
