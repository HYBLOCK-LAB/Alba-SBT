# Alba-SBT Contracts

## Prerequisites

- Foundry installed
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
```

## Test

```bash
forge test
```

## Deploy To Sepolia

```bash
source .env
forge script script/DeployAlbaSBT.s.sol:DeployAlbaSBTScript \
  --rpc-url "$SEPOLIA_RPC_URL" \
  --broadcast
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
