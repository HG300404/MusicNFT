# Music NFT Upload API - New Endpoints

## Overview

Two new endpoints have been added for simplified music NFT creation and minting preparation. The API uses **Storacha (web3.storage)** for decentralized IPFS storage.

---

## POST /upload

Upload music track and cover art with **auto-generated metadata** to IPFS.

### Request

**Endpoint:** `POST /upload`

**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `track` | File | Yes | Audio file (MP3, WAV, etc.) |
| `cover` | File | Yes | Cover image (JPG, PNG, etc.) |
| `prompt` | String | Yes | Description of the music |
| `username` | String | Yes | Artist/creator username |
| `token_id` | String | No | Custom token ID (UUID generated if not provided) |
| `external_url` | String | No | External URL for the NFT |

### Example Request (cURL)

```bash
curl -X POST http://localhost:3000/upload \
  -F "track=@music.mp3" \
  -F "cover=@artwork.jpg" \
  -F "prompt=Chill lo-fi beats for studying and relaxation" \
  -F "username=AI Composer"
```

### Response Example

```json
{
  "success": true,
  "tokenId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "folderName": "AI Music #a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "folderCid": "bafybeigXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "folderUrl": "ipfs://bafybeigXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "gatewayUrl": "https://w3s.link/ipfs/bafybeigXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "metadataUrl": "ipfs://bafybeigXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/metadata.json",
  "tokenURI": "ipfs://bafybeigXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/metadata.json",
  "tokenURIGateway": "https://w3s.link/ipfs/bafybeigXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/metadata.json",
  "trackUrl": "ipfs://bafybeigXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/track.mp3",
  "coverUrl": "ipfs://bafybeigXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/cover.jpg",
  "metadata": {
    "name": "AI Music #a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "description": "Chill lo-fi beats for studying and relaxation",
    "image": "cover.jpg",
    "music": "track.mp3",
    "external_url": "https://your-project-domain.com/nft/a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "attributes": [
      { "trait_type": "Artist", "value": "AI Composer" },
      { "trait_type": "Duration", "value": "3:25" },
      { "trait_type": "Created At", "value": "2025-12-20T01:11:05.000Z" }
    ]
  },
  "files": {
    "track": "track.mp3",
    "cover": "cover.jpg",
    "metadata": "metadata.json"
  }
}
```

### Features

✅ Auto-generated UUID for token_id  
✅ Auto-extracted audio duration  
✅ Auto-generated timestamp  
✅ Folder structure on IPFS: `AI Music #{{token_id}}/`
✅ **tokenURI included in response** - ready for NFT minting!

---

## POST /upload/mint/prepare

Generate `tokenURI` for NFT minting from IPFS CID.

### Request

**Endpoint:** `POST /upload/mint/prepare`

**Content-Type:** `application/json`

```json
{
  "folderCid": "QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}
```

### Response

```json
{
  "success": true,
  "tokenURI": "ipfs://QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/metadata.json"
}
```

---

## Complete Workflow

1. **Upload**: `POST /upload` with track and cover
   - Response includes `tokenURI` ready for minting
2. **Mint**: Use `tokenURI` from response in your smart contract

**Note:** The `/upload/mint/prepare` endpoint is still available but optional, since `tokenURI` is now included in the upload response.

## Notes

- Duration extraction is automatic
- Token ID is auto-generated as UUID v4 if not provided
- Folder name follows pattern: `AI Music #{{token_id}}`
- File names are standardized to `track.{ext}` and `cover.{ext}`
