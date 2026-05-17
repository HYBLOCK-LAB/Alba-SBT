# Alba-SBT Contracts

This directory uses a mixed workflow:

- Foundry for contract compilation and Solidity-native tests
- Hardhat + TypeScript for deployment and app-facing operational scripts

## Prerequisites

- Foundry installed
- Node.js installed
- Node.js 20 or 22 LTS recommended for Hardhat
- Sepolia RPC endpoint
- funded deployer wallet on Sepolia

## Environment

Copy `.env.example` to `.env` and fill in:

```env
SEPOLIA_RPC_URL=
DEPLOYER_PRIVATE_KEY=
INITIAL_OWNER_ADDRESS=
PLATFORM_SIGNER_ADDRESS=
ETHERSCAN_API_KEY=
ALBA_SBT_CONTRACT_ADDRESS=
MANAGER_ADDRESS=
MANAGER_AUTHORIZED=true
```

## Install Hardhat Tooling

```bash
npm install
```

## Test With Foundry

```bash
forge test
```

## Compile With Hardhat

```bash
npx hardhat compile
```

## Deploy To Sepolia

### Foundry path

```bash
source .env
forge script script/DeployAlbaSBT.s.sol:DeployAlbaSBTScript \
  --rpc-url "$SEPOLIA_RPC_URL" \
  --broadcast
```

### Hardhat path

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

The Hardhat deployment script also saves deployment metadata to `deployments/sepolia.json`.

## Operational Scripts

Read deployed contract state:

```bash
npx hardhat run scripts/read-contract.ts --network sepolia
```

Authorize or revoke a manager:

```bash
npx hardhat run scripts/set-manager.ts --network sepolia
```

## Optional Verify

```bash
forge verify-contract <DEPLOYED_CONTRACT_ADDRESS> src/AlbaSBT.sol:AlbaSBT \
  --chain-id 11155111 \
  --etherscan-api-key "$ETHERSCAN_API_KEY"
```

## Post-Deploy Share Checklist

- deployed contract address
- deployment tx hash
- ABI
- chain id `11155111`
- current platform signer address
- current owner address
