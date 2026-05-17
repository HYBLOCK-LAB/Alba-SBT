import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { ethers, network } from "hardhat";

async function main() {
  const initialOwner = requireEnv("INITIAL_OWNER_ADDRESS");
  const platformSigner = requireEnv("PLATFORM_SIGNER_ADDRESS");

  const factory = await ethers.getContractFactory("AlbaSBT");
  const contract = await factory.deploy(initialOwner, platformSigner);
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  const deployTx = contract.deploymentTransaction();
  const deploymentTxHash = deployTx?.hash ?? "";

  console.log("Network:", network.name);
  console.log("Contract:", contractAddress);
  console.log("Initial owner:", initialOwner);
  console.log("Platform signer:", platformSigner);
  console.log("Deployment tx:", deploymentTxHash);

  await persistDeployment({
    network: network.name,
    contractAddress,
    initialOwner,
    platformSigner,
    deploymentTxHash,
    deployedAt: new Date().toISOString()
  });
}

async function persistDeployment(payload: {
  network: string;
  contractAddress: string;
  initialOwner: string;
  platformSigner: string;
  deploymentTxHash: string;
  deployedAt: string;
}) {
  const directory = path.join(process.cwd(), "deployments");
  await mkdir(directory, { recursive: true });

  const outputPath = path.join(directory, `${payload.network}.json`);
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log("Saved deployment info:", outputPath);
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
