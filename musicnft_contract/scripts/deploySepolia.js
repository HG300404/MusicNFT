import hardhat from "hardhat";

const { ethers } = hardhat;

/**
 * Script deploy contract MusicNFT lên Sepolia testnet
 * 
 * Cách chạy:
 * 1. Tạo file .env với SEPOLIA_RPC_URL và PRIVATE_KEY
 * 2. Chạy: npx hardhat run scripts/deploySepolia.js --network sepolia
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Kiểm tra balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  if (balance < ethers.parseEther("0.01")) {
    console.warn("⚠️  Balance thấp! Cần ít nhất 0.01 ETH để deploy.");
    console.log("   Lấy Sepolia ETH từ: https://sepoliafaucet.com/");
  }

  // Lấy tham số từ .env hoặc dùng mặc định
  const defaultRoyaltyReceiver =
    process.env.DEFAULT_ROYALTY_RECEIVER || deployer.address;
  const defaultRoyaltyFee =
    BigInt(process.env.DEFAULT_ROYALTY_FEE || "500"); // 5%

  // Parse initialMintPrice properly
  const initialMintPrice = process.env.INITIAL_MINT_PRICE
    ? ethers.parseEther(process.env.INITIAL_MINT_PRICE)
    : ethers.parseEther("0.001"); // 0.001 ETH default

  console.log("\n=== Deploying MusicNFT ===");
  console.log("Default Royalty Receiver:", defaultRoyaltyReceiver);
  console.log("Default Royalty Fee:", Number(defaultRoyaltyFee), "/ 10000 =",
    Number(defaultRoyaltyFee) / 100, "%");
  console.log("Initial Mint Price:", ethers.formatEther(initialMintPrice), "ETH");

  const MusicNFT = await ethers.getContractFactory("MusicNFT");

  console.log("\nDeploying contract...");
  const nft = await MusicNFT.deploy(
    defaultRoyaltyReceiver,
    defaultRoyaltyFee,
    initialMintPrice
  );
  await nft.waitForDeployment();

  const contractAddress = await nft.getAddress();
  console.log("\n✅ Contract deployed successfully!");
  console.log("Contract Address:", contractAddress);
  console.log("Explorer:", `https://sepolia.etherscan.io/address/${contractAddress}`);

  // Lưu address vào file để dùng sau
  const fs = await import("fs");
  const deploymentInfo = {
    network: "sepolia",
    contractAddress: contractAddress,
    deployer: deployer.address,
    defaultRoyaltyReceiver: defaultRoyaltyReceiver,
    defaultRoyaltyFee: defaultRoyaltyFee.toString(),
    initialMintPrice: initialMintPrice.toString(),
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    "deployment-sepolia.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n📝 Deployment info saved to: deployment-sepolia.json");

  console.log("\n=== Next Steps ===");
  console.log("1. Verify contract: npx hardhat verify --network sepolia", contractAddress,
    defaultRoyaltyReceiver, defaultRoyaltyFee, initialMintPrice);
  console.log("2. Test mint: npx hardhat run scripts/testMintSepolia.js --network sepolia");
  console.log("3. Export ABI: npx hardhat run scripts/exportABI.js");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

