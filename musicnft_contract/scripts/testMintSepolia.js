import hardhat from "hardhat";
import { readFileSync } from "fs";

const { ethers } = hardhat;

/**
 * Script test mint NFT trên Sepolia testnet
 * 
 * Cách chạy:
 * 1. Đảm bảo đã deploy contract (chạy deploySepolia.js trước)
 * 2. Chạy: npx hardhat run scripts/testMintSepolia.js --network sepolia
 */
async function main() {
  // Đọc deployment info từ file
  let contractAddress;
  try {
    const deploymentInfo = JSON.parse(
      readFileSync("deployment-sepolia.json", "utf-8")
    );
    contractAddress = deploymentInfo.contractAddress;
    console.log("📄 Found deployment info:");
    console.log("   Contract Address:", contractAddress);
    console.log("   Network:", deploymentInfo.network);
  } catch (error) {
    console.error("❌ Không tìm thấy file deployment-sepolia.json");
    console.error("   Hãy chạy deploySepolia.js trước!");
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();
  console.log("\n=== Test Mint NFT ===");
  console.log("Deployer (Owner):", deployer.address);
  console.log("Recipient:", deployer.address, "(minting to self)");

  // Kiểm tra balance
  const deployerBalance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(deployerBalance), "ETH");

  // Kết nối với contract đã deploy
  const MusicNFT = await ethers.getContractFactory("MusicNFT");
  const nft = MusicNFT.attach(contractAddress);

  console.log("\n=== Minting NFT ===");
  const dummyURI = "ipfs://QmDummyHash123456789";
  console.log("Token URI:", dummyURI);

  // Lấy mint price từ contract
  const mintPrice = await nft.mintPrice();
  console.log("Mint Price:", ethers.formatEther(mintPrice), "ETH");

  // Mint NFT - Owner mint miễn phí (không cần gửi ETH)
  const mintTx = await nft.mintMusic(
    deployer.address,        // to (mint cho chính mình)
    dummyURI,                // metadataURI
    deployer.address,        // royaltyReceiver
    500                      // royaltyFee (5%)
    // Không cần { value: mintPrice } vì owner mint miễn phí
  );

  console.log("Transaction hash:", mintTx.hash);
  console.log("Waiting for confirmation...");

  const receipt = await mintTx.wait();
  console.log("✅ Transaction confirmed!");
  console.log("   Block:", receipt.blockNumber);
  console.log("   Gas used:", receipt.gasUsed.toString());

  // Đọc event MusicMinted
  const event = receipt.logs.find(
    (log) => {
      try {
        const parsed = nft.interface.parseLog(log);
        return parsed && parsed.name === "MusicMinted";
      } catch {
        return false;
      }
    }
  );

  if (event) {
    const parsed = nft.interface.parseLog(event);
    console.log("\n=== NFT Minted Successfully ===");
    console.log("Token ID:", parsed.args.tokenId.toString());
    console.log("Owner:", parsed.args.to);
    console.log("Token URI:", parsed.args.tokenURI);
    console.log("Royalty Receiver:", parsed.args.royaltyReceiver);
    console.log("Royalty Fee:", parsed.args.royaltyFee.toString(), "/ 10000 =",
      Number(parsed.args.royaltyFee) / 100, "%");

    // Kiểm tra tokenURI
    const tokenId = parsed.args.tokenId;
    const tokenURI = await nft.tokenURI(tokenId);
    console.log("\n✅ Verified tokenURI:", tokenURI);

    // Kiểm tra owner
    const owner = await nft.ownerOf(tokenId);
    console.log("✅ Verified owner:", owner);

    // Kiểm tra royalty info
    const [royaltyReceiver, royaltyAmount] = await nft.royaltyInfo(
      tokenId,
      ethers.parseEther("1") // Giả sử bán với giá 1 ETH
    );
    console.log("✅ Royalty info (for 1 ETH sale):");
    console.log("   Receiver:", royaltyReceiver);
    console.log("   Amount:", ethers.formatEther(royaltyAmount), "ETH");

    console.log("\n=== Explorer Links ===");
    console.log("Contract:", `https://sepolia.etherscan.io/address/${contractAddress}`);
    console.log("Transaction:", `https://sepolia.etherscan.io/tx/${mintTx.hash}`);

    // Test withdraw
    console.log("\n=== Testing Withdraw ===");
    const contractBalance = await ethers.provider.getBalance(await nft.getAddress());
    console.log("Contract balance:", ethers.formatEther(contractBalance), "ETH");

    if (contractBalance > 0) {
      console.log("Withdrawing funds...");
      const withdrawTx = await nft.withdraw();
      await withdrawTx.wait();
      console.log("✅ Withdraw successful!");
      console.log("   Transaction:", `https://sepolia.etherscan.io/tx/${withdrawTx.hash}`);
    } else {
      console.log("⚠️  No funds to withdraw (owner minted for free)");
    }
  } else {
    console.log("⚠️  Không tìm thấy event MusicMinted");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

