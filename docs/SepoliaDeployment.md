# Alba-SBT Sepolia Deployment Checklist

## Scope

This document defines the minimum deployment preparation for developer C before Sepolia deployment and handoff to backend/frontend teammates.

## Deployment Target

- Network: Sepolia
- Chain ID: `11155111`
- Contract: `AlbaSBT`

## Required Environment Values

Developer C should prepare the following values locally before deployment.

```env
SEPOLIA_RPC_URL=
DEPLOYER_PRIVATE_KEY=
PLATFORM_SIGNER_ADDRESS=
INITIAL_OWNER_ADDRESS=
ETHERSCAN_API_KEY=
```

### Field Meaning

- `SEPOLIA_RPC_URL`: Sepolia RPC endpoint
- `DEPLOYER_PRIVATE_KEY`: deployer wallet private key
- `PLATFORM_SIGNER_ADDRESS`: platform signer address used for Lv.1 mint and multisig validation
- `INITIAL_OWNER_ADDRESS`: owner address for signer and manager authorization control
- `ETHERSCAN_API_KEY`: optional, for source verification

## Pre-Deploy Checks

- confirm `AlbaSBT.sol` compiles successfully
- confirm `forge test` passes
- confirm `platformSigner` address is final for current deployment round
- confirm initial owner address is final
- confirm manager authorization strategy for current phase
- confirm chain id is Sepolia in signing domain assumptions

## Deploy Outputs To Share

After deployment, C should share:

- deployed contract address
- deployed chain id
- contract ABI JSON
- platform signer address used in deployment cycle
- initial owner address
- deployment transaction hash

## Post-Deploy Verification

- confirm contract is deployed on Sepolia
- confirm `name()` returns `AlbaSBT`
- confirm `symbol()` returns `ASBT`
- confirm `platformSigner()` matches expected value
- confirm `domainSeparator()` is stable
- verify source code on Etherscan if needed

## Handoff To B-2

Developer B-2 needs:

- deployed contract address
- ABI
- `approveLevelUp(worker, level, nonce, sig1, sig2, tokenURI)` signature
- `mintInitialLevel(worker, tokenURI)` signature
- nonce semantics: worker-address-scoped
- token id handling rule: treat as string off-chain

## Handoff To A

Developer A needs:

- deployed contract address
- chain id `11155111`
- ABI, if directly referenced by C's web3 layer
- confirmation that wallet network is Sepolia

## Re-Deployment Policy

- proxy pattern is not required for current project scope
- if a critical bug is found, redeploy a new contract
- after redeploy, C must re-share:
  - contract address
  - ABI
  - platform signer assumptions
  - updated signing domain verifying contract

## Current Status

- contract draft implemented
- Foundry test suite passing
- deployment script not yet added
- live Sepolia deployment not yet executed

