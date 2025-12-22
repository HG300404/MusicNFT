import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

/**
 * Script export ABI và contract address cho Dev4 (Frontend)
 * 
 * Cách chạy:
 * npx hardhat run scripts/exportABI.js
 * 
 * Output:
 * - frontend/MusicNFT.json: ABI + address đầy đủ
 * - frontend/MusicNFT-address.txt: Chỉ address (để copy nhanh)
 */
async function main() {
  console.log("=== Exporting ABI & Contract Address for Dev4 ===\n");

  // Đọc deployment info
  let deploymentInfo;
  try {
    const deploymentData = readFileSync("deployment-sepolia.json", "utf-8");
    deploymentInfo = JSON.parse(deploymentData);
    console.log("✅ Found deployment info from deployment-sepolia.json");
  } catch (error) {
    console.error("❌ Không tìm thấy file deployment-sepolia.json");
    console.error("   Hãy deploy contract lên Sepolia trước!");
    process.exit(1);
  }

  // Đọc ABI từ artifacts
  let artifact;
  try {
    const artifactPath = join(
      process.cwd(),
      "artifacts",
      "contracts",
      "MusicNFT.sol",
      "MusicNFT.json"
    );
    const artifactData = readFileSync(artifactPath, "utf-8");
    artifact = JSON.parse(artifactData);
    console.log("✅ Found contract ABI from artifacts");
  } catch (error) {
    console.error("❌ Không tìm thấy ABI trong artifacts");
    console.error("   Hãy chạy: npx hardhat compile");
    process.exit(1);
  }

  // Tạo thư mục frontend nếu chưa có
  const frontendDir = join(process.cwd(), "frontend");
  try {
    await import("fs/promises").then((fs) =>
      fs.mkdir(frontendDir, { recursive: true })
    );
  } catch (error) {
    // Thư mục đã tồn tại hoặc lỗi khác
  }

  // Tạo file JSON đầy đủ cho Frontend
  const frontendData = {
    contractName: "MusicNFT",
    network: deploymentInfo.network,
    contractAddress: deploymentInfo.contractAddress,
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    deployedAt: deploymentInfo.deployedAt,
    deployer: deploymentInfo.deployer,
    defaultRoyaltyReceiver: deploymentInfo.defaultRoyaltyReceiver,
    defaultRoyaltyFee: deploymentInfo.defaultRoyaltyFee,
    // Thông tin hữu ích cho Dev4
    info: {
      chainId: 11155111, // Sepolia
      explorer: `https://sepolia.etherscan.io/address/${deploymentInfo.contractAddress}`,
      standard: "ERC-721 with EIP-2981 (Royalty)",
      mainFunction: "mintMusic(address to, string calldata metadataURI, address royaltyReceiver, uint96 royaltyFee)",
    },
  };

  const outputPath = join(frontendDir, "MusicNFT.json");
  writeFileSync(outputPath, JSON.stringify(frontendData, null, 2));
  console.log(`\n✅ Created: ${outputPath}`);

  // Tạo file chỉ có address (để copy nhanh)
  const addressPath = join(frontendDir, "MusicNFT-address.txt");
  writeFileSync(addressPath, deploymentInfo.contractAddress);
  console.log(`✅ Created: ${addressPath}`);

  // Tạo file chỉ có ABI (nếu Dev4 chỉ cần ABI)
  const abiPath = join(frontendDir, "MusicNFT-abi.json");
  writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
  console.log(`✅ Created: ${abiPath}`);

  // Tạo README hướng dẫn cho Dev4
  const readmeContent = `# MusicNFT Contract - Information for Frontend

## Contract Address
\`\`\`
${deploymentInfo.contractAddress}
\`\`\`

## Network
- **Network**: Sepolia Testnet
- **Chain ID**: 11155111
- **Explorer**: https://sepolia.etherscan.io/address/${deploymentInfo.contractAddress}

## Files
- \`MusicNFT.json\`: Full contract info (ABI + address + metadata)
- \`MusicNFT-abi.json\`: Chỉ ABI
- \`MusicNFT-address.txt\`: Chỉ contract address

## Usage Example (JavaScript/TypeScript)

\`\`\`javascript
import { ethers } from "ethers";
import MusicNFTData from "./MusicNFT.json";

// Kết nối với contract
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const contract = new ethers.Contract(
  MusicNFTData.contractAddress,
  MusicNFTData.abi,
  signer
);

// Mint NFT
const tx = await contract.mintMusic(
  userAddress,           // to
  "ipfs://QmHash...",    // metadataURI (từ IPFS)
  userAddress,           // royaltyReceiver (hoặc address(0) để dùng default)
  500                    // royaltyFee (500 = 5%)
);
await tx.wait();
\`\`\`

## Main Functions

### mintMusic
\`\`\`
function mintMusic(
  address to,
  string calldata metadataURI,
  address royaltyReceiver,
  uint96 royaltyFee
) external onlyOwner returns (uint256)
\`\`\`

**Parameters:**
- \`to\`: Địa chỉ ví nhận NFT
- \`metadataURI\`: URI metadata trên IPFS (ví dụ: "ipfs://QmHash...")
- \`royaltyReceiver\`: Ví nhận royalty (address(0) = dùng default)
- \`royaltyFee\`: Phí royalty (500 = 5%, base 10000)

**Returns:** Token ID của NFT vừa mint

### tokenURI
\`\`\`
function tokenURI(uint256 tokenId) public view returns (string memory)
\`\`\`

Lấy metadata URI của token.

### ownerOf
\`\`\`
function ownerOf(uint256 tokenId) public view returns (address)
\`\`\`

Lấy địa chỉ chủ sở hữu của token.

### royaltyInfo
\`\`\`
function royaltyInfo(uint256 tokenId, uint256 salePrice) 
  public view returns (address receiver, uint256 amount)
\`\`\`

Lấy thông tin royalty cho token (EIP-2981).

## Notes
- Contract chỉ cho phép owner (deployer) mint NFT
- Frontend cần gọi mint thông qua backend hoặc yêu cầu owner ký transaction
- Metadata URI phải là chuẩn ERC-721 JSON format trên IPFS
`;

  const readmePath = join(frontendDir, "README.md");
  writeFileSync(readmePath, readmeContent);
  console.log(`✅ Created: ${readmePath}`);

  console.log("\n=== Summary ===");
  console.log("Contract Address:", deploymentInfo.contractAddress);
  console.log("Network:", deploymentInfo.network);
  console.log("ABI functions:", artifact.abi.length, "functions");
  console.log("\n📦 Files ready for Dev4 in folder: frontend/");
  console.log("   - MusicNFT.json (full info)");
  console.log("   - MusicNFT-abi.json (ABI only)");
  console.log("   - MusicNFT-address.txt (address only)");
  console.log("   - README.md (usage guide)");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

