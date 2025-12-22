# Hướng dẫn Deploy Contract lên Sepolia Testnet

## 📋 Tổng quan

Hướng dẫn này giúp bạn:
1. ✅ Cấu hình môi trường cho Sepolia testnet
2. ✅ Deploy contract MusicNFT lên Sepolia
3. ✅ Test mint NFT trên testnet
4. ✅ Export ABI + address cho Dev4 (Frontend)

---

## 🔧 Bước 1: Chuẩn bị môi trường

### 1.1. Lấy Sepolia ETH (Testnet)

Bạn cần Sepolia ETH để trả gas fee:
- **Faucet 1**: https://sepoliafaucet.com/
- **Faucet 2**: https://www.alchemy.com/faucets/ethereum-sepolia
- **Faucet 3**: https://faucet.quicknode.com/ethereum/sepolia

Cần ít nhất **0.01 ETH** để deploy và test.

### 1.2. Lấy RPC URL

Chọn một trong các dịch vụ sau:

**Option A: Infura (Miễn phí)**
1. Đăng ký tại: https://infura.io/
2. Tạo project mới
3. Copy RPC URL (dạng: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`)

**Option B: Alchemy (Miễn phí)**
1. Đăng ký tại: https://www.alchemy.com/
2. Tạo app mới, chọn Sepolia network
3. Copy RPC URL (dạng: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`)

### 1.3. Lấy Private Key từ Metamask

⚠️ **CẢNH BÁO**: Private key rất nhạy cảm, không chia sẻ với ai!

1. Mở Metamask
2. Vào **Settings** > **Security & Privacy**
3. Click **Show Private Key**
4. Copy private key (KHÔNG có `0x` ở đầu)

### 1.4. Tạo file .env

1. Copy file `env.example.txt` thành `.env`:
   ```bash
   copy env.example.txt .env
   ```

2. Mở file `.env` và điền thông tin:
   ```env
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
   PRIVATE_KEY=your_private_key_without_0x
   DEFAULT_ROYALTY_RECEIVER=
   DEFAULT_ROYALTY_FEE=500
   ETHERSCAN_API_KEY=your_etherscan_api_key_optional
   ```

3. ⚠️ **QUAN TRỌNG**: Thêm `.env` vào `.gitignore` để không commit lên Git!

---

## 🚀 Bước 2: Deploy Contract lên Sepolia

### 2.1. Compile contract

```bash
npx hardhat compile
```

### 2.2. Deploy lên Sepolia

```bash
npx hardhat run scripts/deploySepolia.js --network sepolia
```

**Kết quả mong đợi:**
```
Deploying with account: 0x...
Account balance: 0.1 ETH
=== Deploying MusicNFT ===
...
✅ Contract deployed successfully!
Contract Address: 0x...
Explorer: https://sepolia.etherscan.io/address/0x...
📝 Deployment info saved to: deployment-sepolia.json
```

**Lưu ý:**
- Script sẽ tự động lưu thông tin deploy vào `deployment-sepolia.json`
- Copy contract address để dùng cho các bước sau

### 2.3. Verify contract trên Etherscan (Optional)

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <ROYALTY_RECEIVER> <ROYALTY_FEE>
```

Ví dụ:
```bash
npx hardhat verify --network sepolia 0x123... 0x456... 500
```

---

## 🧪 Bước 3: Test Mint NFT trên Sepolia

### 3.1. Chạy script test mint

```bash
npx hardhat run scripts/testMintSepolia.js --network sepolia
```

**Kết quả mong đợi:**
```
=== Test Mint NFT ===
Deployer (Owner): 0x...
Recipient: 0x...
=== Minting NFT ===
...
✅ NFT Minted Successfully!
Token ID: 1
Owner: 0x...
Token URI: ipfs://QmDummyHash123456789
...
```

**Script sẽ kiểm tra:**
- ✅ Transaction được confirm
- ✅ Token ID được tạo
- ✅ Token URI đúng
- ✅ Owner đúng
- ✅ Royalty info hoạt động

### 3.2. Kiểm tra trên Etherscan

1. Mở link Explorer từ output
2. Xem transaction details
3. Xem contract code (nếu đã verify)

---

## 📦 Bước 4: Export ABI + Address cho Dev4

### 4.1. Chạy script export

```bash
npx hardhat run scripts/exportABI.js
```

**Kết quả:**
```
=== Exporting ABI & Contract Address for Dev4 ===
✅ Found deployment info from deployment-sepolia.json
✅ Found contract ABI from artifacts
✅ Created: frontend/MusicNFT.json
✅ Created: frontend/MusicNFT-address.txt
✅ Created: frontend/MusicNFT-abi.json
✅ Created: frontend/README.md
```

### 4.2. Files được tạo trong folder `frontend/`

- **`MusicNFT.json`**: File đầy đủ (ABI + address + metadata)
- **`MusicNFT-abi.json`**: Chỉ ABI (để import vào Frontend)
- **`MusicNFT-address.txt`**: Chỉ contract address (để copy nhanh)
- **`README.md`**: Hướng dẫn sử dụng cho Dev4

### 4.3. Giao cho Dev4

Gửi toàn bộ folder `frontend/` cho Dev4, hoặc chỉ cần:
- `MusicNFT.json` (file chính)
- `README.md` (hướng dẫn)

---

## 📝 Tóm tắt các lệnh

```bash
# 1. Compile
npx hardhat compile

# 2. Deploy lên Sepolia
npx hardhat run scripts/deploySepolia.js --network sepolia

# 3. Test mint
npx hardhat run scripts/testMintSepolia.js --network sepolia

# 4. Export ABI cho Dev4
npx hardhat run scripts/exportABI.js

# 5. Verify contract (optional)
npx hardhat verify --network sepolia <ADDRESS> <ROYALTY_RECEIVER> <ROYALTY_FEE>
```

---

## 🔍 Troubleshooting

### Lỗi: "insufficient funds"
- **Nguyên nhân**: Không đủ Sepolia ETH
- **Giải pháp**: Lấy thêm từ faucet

### Lỗi: "nonce too high"
- **Nguyên nhân**: Transaction bị stuck
- **Giải pháp**: Reset Metamask nonce hoặc đợi vài phút

### Lỗi: "contract not found"
- **Nguyên nhân**: Chưa deploy hoặc sai network
- **Giải pháp**: Kiểm tra `deployment-sepolia.json` và network config

### Lỗi: "onlyOwner"
- **Nguyên nhân**: Gọi mint từ ví không phải owner
- **Giải pháp**: Đảm bảo dùng đúng private key của deployer

---

## ✅ Checklist hoàn thành

- [ ] Đã tạo file `.env` với RPC URL và private key
- [ ] Đã có Sepolia ETH trong ví
- [ ] Đã compile contract thành công
- [ ] Đã deploy contract lên Sepolia
- [ ] Đã test mint NFT thành công
- [ ] Đã export ABI + address cho Dev4
- [ ] Đã giao files cho Dev4

---

## 📞 Liên hệ

Nếu gặp vấn đề, kiểm tra:
1. File `.env` đã đúng format chưa
2. Sepolia ETH đủ chưa
3. RPC URL còn hoạt động không
4. Private key đúng chưa (không có `0x`)
