# 🎵 MusicNFT Smart Contract

AI-powered Music NFT platform smart contract built on Ethereum. Mint unique music NFTs with ERC-721 standard and EIP-2981 royalty support.

## 📋 Overview

**Contract Address (Sepolia):** `0x8E65aEe95f6B0249eAD4A4847E5e398551C97D52`

**Features:**
- ✅ ERC-721 NFT standard
- ✅ EIP-2981 royalty support (5% default)
- ✅ Configurable mint price
- ✅ Owner can mint for free
- ✅ Withdraw collected funds
- ✅ IPFS metadata storage

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- npm v9+
- MetaMask wallet
- Sepolia ETH ([Get from faucet](https://sepoliafaucet.com/))

### Installation

```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test
```

### Environment Setup

Create `.env` file:

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=your_private_key_without_0x
DEFAULT_ROYALTY_FEE=500
INITIAL_MINT_PRICE=0.001
```

---

## 📝 Usage

### Deploy Contract

```bash
npx hardhat run scripts/deploySepolia.js --network sepolia
```

### Mint NFT

```bash
npx hardhat run scripts/testMintSepolia.js --network sepolia
```

### Export ABI

```bash
npx hardhat run scripts/exportABI.js
```

**Output:** `frontend/MusicNFT.json` (for frontend integration)

---

## 🏗️ Project Structure

```
musicnft_contract/
├── contracts/
│   └── MusicNFT.sol           # Main smart contract
├── scripts/
│   ├── deploySepolia.js       # Deploy to Sepolia
│   ├── testMintSepolia.js     # Test minting
│   └── exportABI.js           # Export ABI for frontend
├── test/
│   └── MusicNFT.test.js       # Contract tests (18 tests)
├── frontend/
│   ├── MusicNFT.json          # ABI + address + metadata
│   ├── MusicNFT-abi.json      # ABI only
│   ├── MusicNFT-address.txt   # Address only
│   └── README.md              # Frontend integration guide
├── hardhat.config.js          # Hardhat configuration
├── package.json               # Dependencies
└── .env                       # Environment variables (not committed)
```

---

## 🔧 Contract Functions

### Main Functions

**`mintMusic(address to, string memory metadataURI, address royaltyReceiver, uint96 royaltyFee)`**
- Mint new music NFT
- Owner mints for free, others pay mint price
- Set royalty receiver and fee per NFT

**`tokenURI(uint256 tokenId)`**
- Get metadata URI for NFT
- Returns IPFS URI: `ipfs://...`

**`setMintPrice(uint256 newPrice)`**
- Update mint price (owner only)
- Price in wei

**`withdraw()`**
- Withdraw collected ETH (owner only)

**`royaltyInfo(uint256 tokenId, uint256 salePrice)`**
- Get royalty info (EIP-2981)
- Returns receiver address and amount

---

## 🧪 Testing

Run all tests:

```bash
npx hardhat test
```

**Test Coverage:**
- ✅ Deployment & initialization
- ✅ Minting (owner & user)
- ✅ Mint price management
- ✅ Withdraw functionality
- ✅ Royalty calculations
- ✅ Access control

**Results:** 18 passing tests

---

## 🌐 Deployed Contract

### Sepolia Testnet

- **Address:** `0x8E65aEe95f6B0249eAD4A4847E5e398551C97D52`
- **Network:** Sepolia
- **Chain ID:** 11155111
- **Explorer:** [View on Etherscan](https://sepolia.etherscan.io/address/0x8E65aEe95f6B0249eAD4A4847E5e398551C97D52)

### Contract Info

- **Name:** MusicNFT
- **Symbol:** MUSIC
- **Mint Price:** 0.001 ETH
- **Default Royalty:** 5%
- **Total Supply:** Dynamic (incremental)

---

## 🔗 Integration

### For Frontend (Dev 4)

**1. Copy ABI file:**
```bash
cp frontend/MusicNFT.json ../music_nft_front_end/lib/
```

**2. Use in code:**
```typescript
import MusicNFTData from './MusicNFT.json'

const contract = new ethers.Contract(
  MusicNFTData.contractAddress,
  MusicNFTData.abi,
  signer
)

// Mint NFT
await contract.mintMusic(
  userAddress,
  'ipfs://bafybeig.../metadata.json',
  userAddress,
  500,
  { value: ethers.parseEther('0.001') }
)
```

**See:** `frontend/README.md` for detailed integration guide.

---

## 📊 Marketplace Integration

### OpenSea

**Mainnet:** Contract will auto-appear on OpenSea after first mint
- Collection: `https://opensea.io/collection/musicnft-[slug]`

**Testnet:** OpenSea no longer supports testnets

### Alternative (Testnet)

**Rarible Testnet:**
```
https://testnet.rarible.com/collection/sepolia/0x8E65aEe95f6B0249eAD4A4847E5e398551C97D52
```

---

## 🛠️ Development

### Compile

```bash
npx hardhat compile
```

### Test

```bash
npx hardhat test
```

### Deploy

```bash
npx hardhat run scripts/deploySepolia.js --network sepolia
```

### Verify

```bash
npx hardhat verify --network sepolia CONTRACT_ADDRESS "ROYALTY_RECEIVER" 500 "1000000000000000"
```

---

## 📚 Documentation

- **Setup Guide:** See `DEPLOYMENT_GUIDE.md`
- **Frontend Integration:** See `frontend/README.md`
- **Contract Docs:** See inline comments in `contracts/MusicNFT.sol`

---

## 🔐 Security

- ✅ OpenZeppelin contracts used
- ✅ ReentrancyGuard for safety
- ✅ Ownable for access control
- ✅ Input validation
- ⚠️ **Production:** Get security audit before mainnet

---

## 📜 License

MIT License

---

## 🤝 Contributing

This is part of a larger Music NFT platform with 4 components:
- **Dev 1:** Smart Contract (this repo)
- **Dev 2:** AI Music Generator
- **Dev 3:** IPFS Service
- **Dev 4:** Frontend

---

## 📞 Support

- **Etherscan:** https://sepolia.etherscan.io/address/0x8E65aEe95f6B0249eAD4A4847E5e398551C97D52
- **Sepolia Faucet:** https://sepoliafaucet.com/
- **Hardhat Docs:** https://hardhat.org/docs

---

## 🎯 Next Steps

1. ✅ Contract deployed
2. ⬜ Verify contract on Etherscan
3. ⬜ Integrate with frontend
4. ⬜ Test end-to-end flow
5. ⬜ Deploy to mainnet (when ready)
