import "dotenv/config";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";

import type { HardhatUserConfig } from "hardhat/config";

const sepoliaRpcUrl = process.env.SEPOLIA_RPC_URL || "";
const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY || "";
const etherscanApiKey = process.env.ETHERSCAN_API_KEY || "";

const accounts = deployerPrivateKey ? [normalizePrivateKey(deployerPrivateKey)] : [];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  paths: {
    sources: "./src",
    cache: "./hardhat-cache",
    artifacts: "./artifacts"
  },
  networks: {
    sepolia: {
      url: sepoliaRpcUrl,
      accounts
    }
  },
  etherscan: {
    apiKey: {
      sepolia: etherscanApiKey
    }
  }
};

export default config;

function normalizePrivateKey(value: string): string {
  return value.startsWith("0x") ? value : `0x${value}`;
}
