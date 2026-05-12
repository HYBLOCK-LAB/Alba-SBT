import { ethers } from "hardhat";

async function main() {
  const contractAddress = requireEnv("ALBA_SBT_CONTRACT_ADDRESS");
  const managerAddress = requireEnv("MANAGER_ADDRESS");
  const authorizeValue = (process.env.MANAGER_AUTHORIZED || "true").toLowerCase() === "true";

  const contract = await ethers.getContractAt("AlbaSBT", contractAddress);
  const tx = await contract.setManagerAuthorization(managerAddress, authorizeValue);
  const receipt = await tx.wait();

  console.log("Contract:", contractAddress);
  console.log("Manager:", managerAddress);
  console.log("Authorized:", authorizeValue);
  console.log("Tx hash:", receipt?.hash ?? tx.hash);
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
