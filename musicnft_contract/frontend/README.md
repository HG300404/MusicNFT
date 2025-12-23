# MusicNFT Contract - Information for Frontend

## Contract Address
```
0xFCE622EbED82e7283AE366cE6dF39F2aA2526535
```

## Network
- **Network**: Sepolia Testnet
- **Chain ID**: 11155111
- **Explorer**: https://sepolia.etherscan.io/address/0xFCE622EbED82e7283AE366cE6dF39F2aA2526535

## Files
- `MusicNFT.json`: Full contract info (ABI + address + metadata)
- `MusicNFT-abi.json`: Chỉ ABI
- `MusicNFT-address.txt`: Chỉ contract address

## Usage Example (JavaScript/TypeScript)

```javascript
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
```

## Main Functions

### mintMusic
```
function mintMusic(
  address to,
  string calldata metadataURI,
  address royaltyReceiver,
  uint96 royaltyFee
) external onlyOwner returns (uint256)
```

**Parameters:**
- `to`: Địa chỉ ví nhận NFT
- `metadataURI`: URI metadata trên IPFS (ví dụ: "ipfs://QmHash...")
- `royaltyReceiver`: Ví nhận royalty (address(0) = dùng default)
- `royaltyFee`: Phí royalty (500 = 5%, base 10000)

**Returns:** Token ID của NFT vừa mint

### tokenURI
```
function tokenURI(uint256 tokenId) public view returns (string memory)
```

Lấy metadata URI của token.

### ownerOf
```
function ownerOf(uint256 tokenId) public view returns (address)
```

Lấy địa chỉ chủ sở hữu của token.

### royaltyInfo
```
function royaltyInfo(uint256 tokenId, uint256 salePrice) 
  public view returns (address receiver, uint256 amount)
```

Lấy thông tin royalty cho token (EIP-2981).

## Notes
- Contract chỉ cho phép owner (deployer) mint NFT
- Frontend cần gọi mint thông qua backend hoặc yêu cầu owner ký transaction
- Metadata URI phải là chuẩn ERC-721 JSON format trên IPFS
