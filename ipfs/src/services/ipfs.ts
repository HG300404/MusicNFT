import "dotenv/config";
import * as Client from "@storacha/client";
import fs from "fs";
import path from "path";
import util from "util";
import { v4 as uuidv4 } from "uuid";
import { parseFile } from "music-metadata";

// TypeScript interfaces for NFT metadata
export interface NFTAttribute {
  trait_type: string;
  value: string;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  music: string;
  external_url?: string;
  attributes: NFTAttribute[];
}

export interface MetadataInput {
  name: string;
  description: string;
  artist: string;
  duration: string;
  format: string;
  external_url?: string;
  customAttributes?: NFTAttribute[];
}

export class IPFSService {
  private client: any;
  private initialized: boolean = false;

  constructor() {
    console.log("[IPFSService] Initializing Storacha client...");
  }

  /**
   * Initialize the Storacha client and login if needed
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Create Storacha client
      this.client = await Client.create();

      // Check if already logged in (has spaces)
      const spacesIterator = this.client.spaces();
      const spaces = Array.from(spacesIterator);

      if (spaces.length === 0) {
        // Need to login
        const email = process.env.STORACHA_EMAIL;
        if (!email) {
          throw new Error(
            "STORACHA_EMAIL is required in .env file. " +
            "Please add your email and run 'npx @storacha/client login <email>' first."
          );
        }

        console.log(`[IPFSService] Logging in with email: ${email}`);
        console.log("[IPFSService] Please check your email for verification link...");

        await this.client.login(email);

        // After login, check for spaces again
        const spacesAfterLoginIterator = this.client.spaces();
        const spacesAfterLogin = Array.from(spacesAfterLoginIterator);
        if (spacesAfterLogin.length === 0) {
          // Create a default space
          console.log("[IPFSService] Creating default space...");
          await this.client.createSpace("dev3-ipfs-mint");
        }
      }

      // Set current space if not set
      if (!this.client.currentSpace()) {
        const spacesIterator2 = this.client.spaces();
        const spaces2 = Array.from(spacesIterator2);
        if (spaces2.length > 0) {
          await this.client.setCurrentSpace(spaces2[0].did());
          console.log(`[IPFSService] Using space: ${spaces2[0].did()}`);
        }
      }

      this.initialized = true;
      console.log("[IPFSService] Storacha client initialized successfully");
    } catch (error) {
      console.error("[IPFSService] Initialization error:", error);
      throw error;
    }
  }

  /**
   * Upload a single file to Storacha
   */
  async uploadFile(filePath: string, fileName?: string) {
    await this.initialize();

    try {
      const finalName = fileName || path.basename(filePath);
      const fileBuffer = fs.readFileSync(filePath);

      // Create a File object from the buffer
      const file = new File([fileBuffer], finalName, {
        type: this.getMimeType(filePath)
      });

      // Upload to Storacha
      const cid = await this.client.uploadFile(file);

      return {
        cid: cid.toString(),
        ipfsUrl: `ipfs://${cid}`,
        gatewayUrl: `https://w3s.link/ipfs/${cid}`,
      };
    } catch (error) {
      const safeStringify = (obj: unknown) => {
        try {
          if (typeof obj === "string") return obj;
          return JSON.stringify(obj, Object.getOwnPropertyNames(obj), 2);
        } catch {
          return util.inspect(obj, { depth: 4 });
        }
      };

      const msg =
        error instanceof Error ? error.message : safeStringify(error);

      console.error("[IPFS] Upload error RAW:", msg);
      throw new Error(`Failed to upload file to IPFS: ${msg}`);
    }
  }

  /**
   * Get MIME type based on file extension
   */
  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.flac': 'audio/flac',
      '.m4a': 'audio/mp4',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.json': 'application/json',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  async uploadTrack(trackPath: string) {
    return this.uploadFile(trackPath, path.basename(trackPath));
  }

  async uploadCover(coverPath: string) {
    return this.uploadFile(coverPath, path.basename(coverPath));
  }

  async uploadTrackAndCover(trackPath: string, coverPath: string) {
    const [track, cover] = await Promise.all([
      this.uploadTrack(trackPath),
      this.uploadCover(coverPath),
    ]);
    return { track, cover };
  }

  /**
   * Tạo metadata.json cho NFT
   * @param folderCid - CID của folder chứa track và cover
   * @param trackFileName - Tên file track
   * @param coverFileName - Tên file cover
   * @param metadataInput - Thông tin metadata
   */
  createMetadataJson(
    folderCid: string,
    trackFileName: string,
    coverFileName: string,
    metadataInput: MetadataInput
  ): NFTMetadata {
    // Tạo attributes mặc định
    const defaultAttributes: NFTAttribute[] = [
      { trait_type: "Artist", value: metadataInput.artist },
      { trait_type: "Duration", value: metadataInput.duration },
      { trait_type: "Format", value: metadataInput.format },
    ];

    // Merge với custom attributes nếu có
    const allAttributes = [
      ...defaultAttributes,
      ...(metadataInput.customAttributes || []),
    ];

    const metadata: NFTMetadata = {
      name: metadataInput.name,
      description: metadataInput.description,
      image: `ipfs://${folderCid}/${coverFileName}`,
      music: `ipfs://${folderCid}/${trackFileName}`,
      attributes: allAttributes,
    };

    // Thêm external_url nếu có
    if (metadataInput.external_url) {
      metadata.external_url = metadataInput.external_url;
    }

    return metadata;
  }

  /**
   * Upload một folder có sẵn lên IPFS
   * @param folderPath - Đường dẫn tuyệt đối đến folder cần upload
   * @param customName - Tên tùy chỉnh cho folder trên IPFS (optional)
   */
  async uploadFolder(folderPath: string, customName?: string) {
    await this.initialize();

    try {
      if (!fs.existsSync(folderPath)) {
        throw new Error(`Folder không tồn tại: ${folderPath}`);
      }

      const stats = fs.statSync(folderPath);
      if (!stats.isDirectory()) {
        throw new Error(`Đường dẫn không phải là folder: ${folderPath}`);
      }

      const folderName = customName || path.basename(folderPath);

      console.log(`[IPFS] Uploading folder: ${folderPath}`);

      // Read all files in the folder
      const fileNames = fs.readdirSync(folderPath);
      const files: File[] = [];

      for (const fileName of fileNames) {
        const filePath = path.join(folderPath, fileName);
        const fileStat = fs.statSync(filePath);

        if (fileStat.isFile()) {
          const fileBuffer = fs.readFileSync(filePath);
          const file = new File([fileBuffer], fileName, {
            type: this.getMimeType(filePath)
          });
          files.push(file);
        }
      }

      // Upload directory to Storacha
      const cid = await this.client.uploadDirectory(files);

      // Lấy danh sách file trong folder
      const fileList = fileNames.map(file => ({
        name: file,
        url: `ipfs://${cid}/${file}`
      }));

      return {
        folderCid: cid.toString(),
        folderUrl: `ipfs://${cid}`,
        gatewayUrl: `https://w3s.link/ipfs/${cid}`,
        files: fileList,
        folderName: folderName
      };
    } catch (error) {
      const safeStringify = (obj: unknown) => {
        try {
          if (typeof obj === "string") return obj;
          return JSON.stringify(obj, Object.getOwnPropertyNames(obj), 2);
        } catch {
          return util.inspect(obj, { depth: 4 });
        }
      };

      console.error("[IPFS] Upload folder error:", error);
      console.error("[IPFS] Upload folder error details:", safeStringify(error));
      throw error;
    }
  }

  /**
   * Upload track và cover vào một folder trên IPFS
   * Trả về CID của folder chứa cả hai file
   */
  async uploadTrackAndCoverAsFolder(trackPath: string, coverPath: string, folderName: string = "music") {
    try {
      // Tạo thư mục tạm để chứa cả hai file
      const tempDir = path.join(path.dirname(trackPath), folderName);

      // Tạo thư mục nếu chưa tồn tại
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Copy file vào thư mục tạm
      const trackFileName = path.basename(trackPath);
      const coverFileName = path.basename(coverPath);

      const tempTrackPath = path.join(tempDir, trackFileName);
      const tempCoverPath = path.join(tempDir, coverFileName);

      fs.copyFileSync(trackPath, tempTrackPath);
      fs.copyFileSync(coverPath, tempCoverPath);

      try {
        // Upload cả folder lên IPFS
        const result = await this.uploadFolder(tempDir, folderName);

        // Xóa thư mục tạm
        fs.rmSync(tempDir, { recursive: true, force: true });

        return {
          folderCid: result.folderCid,
          folderUrl: result.folderUrl,
          gatewayUrl: result.gatewayUrl,
          trackUrl: `ipfs://${result.folderCid}/${trackFileName}`,
          coverUrl: `ipfs://${result.folderCid}/${coverFileName}`,
          files: {
            track: trackFileName,
            cover: coverFileName,
          }
        };
      } catch (error) {
        // Cleanup nếu có lỗi
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
        throw error;
      }
    } catch (error) {
      const safeStringify = (obj: unknown) => {
        try {
          if (typeof obj === "string") return obj;
          return JSON.stringify(obj, Object.getOwnPropertyNames(obj), 2);
        } catch {
          return util.inspect(obj, { depth: 4 });
        }
      };

      console.error("[IPFS] Upload track/cover folder error:", error);
      console.error("[IPFS] Upload track/cover folder error details:", safeStringify(error));
      throw error;
    }
  }

  /**
   * Upload folder và tạo metadata.json cho NFT
   * @param folderPath - Đường dẫn đến folder chứa track và cover
   * @param trackFileName - Tên file track trong folder
   * @param coverFileName - Tên file cover trong folder
   * @param metadataInput - Thông tin metadata
   * @param customFolderName - Tên tùy chỉnh cho folder (optional)
   */
  async uploadFolderWithMetadata(
    folderPath: string,
    trackFileName: string,
    coverFileName: string,
    metadataInput: MetadataInput,
    customFolderName?: string
  ) {
    try {
      // Upload folder chứa track và cover
      const folderResult = await this.uploadFolder(folderPath, customFolderName);

      // Tạo metadata.json
      const metadata = this.createMetadataJson(
        folderResult.folderCid,
        trackFileName,
        coverFileName,
        metadataInput
      );

      // Lưu metadata.json vào file tạm
      const tempMetadataPath = path.join(folderPath, "metadata.json");
      fs.writeFileSync(tempMetadataPath, JSON.stringify(metadata, null, 2));

      try {
        // Upload metadata.json lên IPFS
        const metadataResult = await this.uploadFile(tempMetadataPath, "metadata.json");

        // Xóa file metadata.json tạm
        fs.unlinkSync(tempMetadataPath);

        return {
          ...folderResult,
          metadata: metadata,
          metadataCid: metadataResult.cid,
          metadataUrl: metadataResult.ipfsUrl,
          metadataGatewayUrl: metadataResult.gatewayUrl,
        };
      } catch (error) {
        // Cleanup metadata file nếu có lỗi
        if (fs.existsSync(tempMetadataPath)) {
          fs.unlinkSync(tempMetadataPath);
        }
        throw error;
      }
    } catch (error) {
      const safeStringify = (obj: unknown) => {
        try {
          if (typeof obj === "string") return obj;
          return JSON.stringify(obj, Object.getOwnPropertyNames(obj), 2);
        } catch {
          return util.inspect(obj, { depth: 4 });
        }
      };

      const msg = error instanceof Error ? error.message : safeStringify(error);
      console.error("[IPFS] Upload folder with metadata error:", msg);
      throw new Error(`Failed to upload folder with metadata to IPFS: ${msg}`);
    }
  }

  /**
   * Upload track và cover riêng lẻ, tạo folder và metadata.json
   * @param trackPath - Đường dẫn file track
   * @param coverPath - Đường dẫn file cover
   * @param metadataInput - Thông tin metadata
   * @param folderName - Tên folder trên IPFS
   */
  async uploadTrackCoverWithMetadata(
    trackPath: string,
    coverPath: string,
    metadataInput: MetadataInput,
    folderName: string = "music-nft"
  ) {
    try {
      // Upload track và cover vào folder
      const folderResult = await this.uploadTrackAndCoverAsFolder(
        trackPath,
        coverPath,
        folderName
      );

      // Tạo metadata.json
      const metadata = this.createMetadataJson(
        folderResult.folderCid,
        folderResult.files.track,
        folderResult.files.cover,
        metadataInput
      );

      // Lưu metadata.json vào file tạm
      const tempDir = path.dirname(trackPath);
      const tempMetadataPath = path.join(tempDir, "metadata.json");
      fs.writeFileSync(tempMetadataPath, JSON.stringify(metadata, null, 2));

      try {
        // Upload metadata.json lên IPFS
        const metadataResult = await this.uploadFile(tempMetadataPath, "metadata.json");

        // Xóa file metadata.json tạm
        fs.unlinkSync(tempMetadataPath);

        return {
          ...folderResult,
          metadata: metadata,
          metadataCid: metadataResult.cid,
          metadataUrl: metadataResult.ipfsUrl,
          metadataGatewayUrl: metadataResult.gatewayUrl,
        };
      } catch (error) {
        // Cleanup metadata file nếu có lỗi
        if (fs.existsSync(tempMetadataPath)) {
          fs.unlinkSync(tempMetadataPath);
        }
        throw error;
      }
    } catch (error) {
      const safeStringify = (obj: unknown) => {
        try {
          if (typeof obj === "string") return obj;
          return JSON.stringify(obj, Object.getOwnPropertyNames(obj), 2);
        } catch {
          return util.inspect(obj, { depth: 4 });
        }
      };

      const msg = error instanceof Error ? error.message : safeStringify(error);
      console.error("[IPFS] Upload track/cover with metadata error:", msg);
      throw new Error(`Failed to upload track/cover with metadata to IPFS: ${msg}`);
    }
  }

  /**
   * Extract audio duration from file
   * @param filePath - Path to audio file
   * @returns Duration in MM:SS format
   */
  async extractAudioDuration(filePath: string): Promise<string> {
    try {
      const metadata = await parseFile(filePath);
      const durationInSeconds = metadata.format.duration || 0;

      const minutes = Math.floor(durationInSeconds / 60);
      const seconds = Math.floor(durationInSeconds % 60);

      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('[IPFS] Error extracting audio duration:', error);
      return '0:00';
    }
  }

  /**
   * Generate UUID for token ID
   */
  generateTokenId(): string {
    return uuidv4();
  }

  /**
   * Get current timestamp in ISO format
   */
  getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Upload music NFT with auto-generated metadata
   * @param trackPath - Path to track file
   * @param coverPath - Path to cover file
   * @param prompt - Description/prompt for the music
   * @param username - Artist/creator username
   * @param tokenId - Optional token ID (will generate UUID if not provided)
   * @param externalUrl - Optional external URL
   * @param customName - Optional custom name for the music (defaults to "AI Music #<UUID>")
   */
  async uploadMusicNFTWithMetadata(
    trackPath: string,
    coverPath: string,
    prompt: string,
    username: string,
    tokenId?: string,
    externalUrl?: string,
    customName?: string
  ) {
    try {
      // Generate token ID if not provided
      const finalTokenId = tokenId || this.generateTokenId();

      // Extract audio duration
      const duration = await this.extractAudioDuration(trackPath);

      // Get current timestamp
      const createdAt = this.getCurrentTimestamp();

      // Use custom name or generate default
      const musicName = customName || `AI Music #${finalTokenId}`;
      const folderName = customName || `AI Music #${finalTokenId}`;

      // Create temp directory for the NFT folder
      const tempDir = path.join(path.dirname(trackPath), folderName);

      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Standardize file names
      const trackExt = path.extname(trackPath);
      const coverExt = path.extname(coverPath);
      const trackFileName = `track${trackExt}`;
      const coverFileName = `cover${coverExt}`;

      const tempTrackPath = path.join(tempDir, trackFileName);
      const tempCoverPath = path.join(tempDir, coverFileName);

      // Copy files to temp directory
      fs.copyFileSync(trackPath, tempTrackPath);
      fs.copyFileSync(coverPath, tempCoverPath);

      try {
        // Generate final external URL if not provided
        const finalExternalUrl = externalUrl || `http://localhost:3000/my-nft/${finalTokenId}`;

        // Create metadata object
        const metadata = {
          name: musicName,
          description: prompt,
          image: `ipfs://${folderResult.folderCid}/${coverFileName}`,
          music: `ipfs://${folderResult.folderCid}/${trackFileName}`,
          external_url: finalExternalUrl,
          attributes: [
            {
              trait_type: "Artist",
              value: username
            },
            {
              trait_type: "Duration",
              value: duration
            },
            {
              trait_type: "Created At",
              value: createdAt
            }
          ]
        };

        // Save metadata.json to temp directory
        const metadataPath = path.join(tempDir, 'metadata.json');
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

        // Upload the entire folder with all files including metadata
        const folderResult = await this.uploadFolder(tempDir, folderName);

        // Clean up temp directory
        fs.rmSync(tempDir, { recursive: true, force: true });

        return {
          success: true,
          tokenId: finalTokenId,
          folderName: folderName,
          folderCid: folderResult.folderCid,
          folderUrl: folderResult.folderUrl,
          gatewayUrl: folderResult.gatewayUrl,
          metadata: metadata,
          metadataUrl: `ipfs://${folderResult.folderCid}/metadata.json`,
          trackUrl: `ipfs://${folderResult.folderCid}/${trackFileName}`,
          coverUrl: `ipfs://${folderResult.folderCid}/${coverFileName}`,
          files: {
            track: trackFileName,
            cover: coverFileName,
            metadata: 'metadata.json'
          }
        };
      } catch (error) {
        // Cleanup on error
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
        throw error;
      }
    } catch (error) {
      const safeStringify = (obj: unknown) => {
        try {
          if (typeof obj === "string") return obj;
          return JSON.stringify(obj, Object.getOwnPropertyNames(obj), 2);
        } catch {
          return util.inspect(obj, { depth: 4 });
        }
      };

      const msg = error instanceof Error ? error.message : safeStringify(error);
      console.error('[IPFS] Upload music NFT with metadata error:', error);
      throw error;
    }
  }
}

// GIỮ NGUYÊN HÀM NÀY
export function createIPFSService(): IPFSService {
  return new IPFSService();
}
