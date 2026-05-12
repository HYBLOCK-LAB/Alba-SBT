import { ethers } from "hardhat";

async function main() {
  const contractAddress = requireEnv("ALBA_SBT_CONTRACT_ADDRESS");
  const contract = await ethers.getContractAt("AlbaSBT", contractAddress);

  const [name, symbol, owner, platformSigner, nextTokenId] = await Promise.all([
    contract.name(),
    contract.symbol(),
    contract.owner(),
    contract.platformSigner(),
    contract.nextTokenId()
  ]);

  console.log("Contract:", contractAddress);
  console.log("Name:", name);
  console.log("Symbol:", symbol);
  console.log("Owner:", owner);
  console.log("Platform signer:", platformSigner);
  console.log("Next token id:", nextTokenId.toString());
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
