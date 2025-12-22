# IPFS Upload Service với Storacha

Service này cho phép bạn upload track (audio) và cover (image) lên IPFS sử dụng Storacha (web3.storage).

## Cài đặt

## Tạo tài khoản Storacha

1. Truy cập: **https://console.storacha.network/**
2. Đăng ký với email của bạn
3. Xác thực email

## Cấu hình file .env

Project sử dụng **email-based authentication** với Storacha.

Mở file `.env` trong thư mục gốc project và thêm email của bạn:

```env
STORACHA_EMAIL=your_email@example.com
PORT=3001
```

**Lưu ý quan trọng:**
- ❌ KHÔNG có dấu ngoặc kép (`"` hoặc `'`)
- ❌ KHÔNG có comment sau giá trị
- ✅ Sử dụng email bạn đã đăng ký với Storacha

## Cài đặt dependencies
```bash
npm install
```

Restart server sau khi cập nhật để biến môi trường được load.

## Cách sử dụng

### 1. Sử dụng API Server

Khởi động server:
```bash
npm run dev
```

Server sẽ chạy tại `http://localhost:3000`

## Login lần đầu

Khi chạy server lần đầu tiên, Storacha sẽ tự động gửi email xác thực đến địa chỉ email bạn đã cấu hình.

**Quy trình login:**
1. Server sẽ gọi `client.login(email)`
2. Storacha gửi email xác thực đến bạn
3. Click vào link trong email để xác thực
4. Sau khi xác thực, client sẽ tự động tạo space và lưu credentials

**Lưu ý:** Bạn chỉ cần login một lần. Sau đó, credentials sẽ được lưu tự động.

#### Upload Track (Audio)
```bash
curl -X POST http://localhost:3000/upload/track \
  -F "track=@./path/to/track.mp3"
```

#### Upload Cover (Image)
```bash
curl -X POST http://localhost:3000/upload/cover \
  -F "cover=@./path/to/cover.jpg"
```

#### Upload cả Track và Cover
```bash
curl -X POST http://localhost:3000/upload/both \
  -F "track=@./path/to/track.mp3" \
  -F "cover=@./path/to/cover.jpg"
```

### Sử dụng trong Code

```typescript
import { createIPFSService } from './src/services/ipfs.js';

// Tạo service instance
const ipfsService = createIPFSService();

// Upload track
const trackResult = await ipfsService.uploadTrack('./audio/track.mp3');
console.log('Track IPFS URL:', trackResult.ipfsUrl);
console.log('Track Gateway URL:', trackResult.gatewayUrl);

// Upload cover
const coverResult = await ipfsService.uploadCover('./images/cover.jpg');
console.log('Cover IPFS URL:', coverResult.ipfsUrl);

// Upload cả hai cùng lúc
const result = await ipfsService.uploadTrackAndCover(
  './audio/track.mp3',
  './images/cover.jpg'
);
console.log('Track:', result.track.ipfsUrl);
console.log('Cover:', result.cover.ipfsUrl);
```

## Response Format

Tất cả các endpoint trả về format tương tự:

```json
{
  "success": true,
  "track": {
    "ipfsUrl": "ipfs://Qm...",
    "gatewayUrl": "https://nftstorage.link/ipfs/Qm...",
    "cid": "Qm..."
  },
  "cover": {
    "ipfsUrl": "ipfs://bafybeig...",
    "gatewayUrl": "https://w3s.link/ipfs/bafybeig...",
    "cid": "bafybeig..."
  }
}
```

## Định dạng file hỗ trợ

### Audio (Track):
- `.mp3`
- `.wav`
- `.flac`
- `.ogg`
- `.m4a`

### Image (Cover):
- `.jpg` / `.jpeg`
- `.png`
- `.gif`
- `.webp`
- `.svg`

## Lưu ý

- File size limit: 100MB (có thể điều chỉnh trong `src/routes/upload.ts`)
- Files được upload lên IPFS và truy cập qua gateway URL
- IPFS URLs có format `ipfs://CID` và dùng được cho NFT metadata

