import { Router } from "express";
import multer from "multer";
import { createIPFSService } from "../services/ipfs.js";
import fs from "fs";
import path from "path";
import os from "os";
import util from "util";

const router = Router();

// Dùng memoryStorage, rồi tự ghi ra file tạm 
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

// POST /upload/track
router.post("/track", upload.single("track"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No track file provided" });
  }
  try {
    console.log("[ROUTE] /upload/track called");

    if (!req.file) {
      return res.status(400).json({ error: "No track file provided" });
    }

    const ipfsService = createIPFSService();

    const tempPath = path.join(os.tmpdir(), req.file.originalname);
    fs.writeFileSync(tempPath, req.file.buffer);

    try {
      const result = await ipfsService.uploadTrack(tempPath);

      fs.unlinkSync(tempPath);

      res.json({
        success: true,
        track: result,
      });
    } catch (error) {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      throw error;
    }
  } catch (error) {
    const safeStringify = (obj: unknown) => {
      try {
        if (typeof obj === "string") return obj;
        return JSON.stringify(obj, Object.getOwnPropertyNames(obj));
      } catch {
        return util.inspect(obj, { depth: 4 });
      }
    };

    console.error("[ROUTE] /upload/track error:", error);

    res.status(500).json({
      error: "Failed to upload track",
      message: error instanceof Error ? error.message : safeStringify(error),
    });
  }
});

// POST /upload/cover
router.post("/cover", upload.single("cover"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No cover file provided" });
  }
  try {
    console.log("[ROUTE] /upload/cover called");

    if (!req.file) {
      return res.status(400).json({ error: "No cover file provided" });
    }

    const ipfsService = createIPFSService();

    const tempPath = path.join(os.tmpdir(), req.file.originalname);
    fs.writeFileSync(tempPath, req.file.buffer);

    try {
      const result = await ipfsService.uploadCover(tempPath);

      fs.unlinkSync(tempPath);

      res.json({
        success: true,
        cover: result,
      });
    } catch (error) {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      throw error;
    }
  } catch (error) {
    const safeStringify = (obj: unknown) => {
      try {
        if (typeof obj === "string") return obj;
        return JSON.stringify(obj, Object.getOwnPropertyNames(obj));
      } catch {
        return util.inspect(obj, { depth: 4 });
      }
    };

    console.error("[ROUTE] /upload/cover error:", error);

    res.status(500).json({
      error: "Failed to upload cover",
      message: error instanceof Error ? error.message : safeStringify(error),
    });
  }
});

// POST /upload/both
router.post(
  "/both",
  upload.fields([
    { name: "track", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  async (req, res) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (!files.track || !files.track[0]) {
      return res.status(400).json({ error: "No track file provided" });
    }
    if (!files.cover || !files.cover[0]) {
      return res.status(400).json({ error: "No cover file provided" });
    }
    try {
      console.log("[ROUTE] /upload/both called");

      const files = req
        .files as unknown as { [fieldname: string]: Express.Multer.File[] };

      console.log("[ROUTE] files:", Object.keys(files || {}));

      if (!files.track || !files.track[0]) {
        return res.status(400).json({ error: "No track file provided" });
      }

      if (!files.cover || !files.cover[0]) {
        return res.status(400).json({ error: "No cover file provided" });
      }

      const ipfsService = createIPFSService();

      const trackPath = path.join(os.tmpdir(), files.track[0].originalname);
      const coverPath = path.join(os.tmpdir(), files.cover[0].originalname);

      fs.writeFileSync(trackPath, files.track[0].buffer);
      fs.writeFileSync(coverPath, files.cover[0].buffer);

      try {
        // Parse metadata nếu có
        const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : null;

        // Nếu có metadata, upload với metadata
        if (metadata) {
          const result = await ipfsService.uploadTrackCoverWithMetadata(
            trackPath,
            coverPath,
            metadata,
            "music-nft" // Tên folder trên IPFS
          );

          fs.unlinkSync(trackPath);
          fs.unlinkSync(coverPath);

          return res.json({
            success: true,
            ...result,
          });
        }

        // Nếu không có metadata, upload folder thông thường
        const result = await ipfsService.uploadTrackAndCoverAsFolder(
          trackPath,
          coverPath,
          "music-nft" // Tên folder trên IPFS
        );

        fs.unlinkSync(trackPath);
        fs.unlinkSync(coverPath);

        res.json({
          success: true,
          ...result,
        });
      } catch (error) {
        if (fs.existsSync(trackPath)) fs.unlinkSync(trackPath);
        if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
        throw error;
      }
    } catch (error) {
      const safeStringify = (obj: unknown) => {
        try {
          if (typeof obj === "string") return obj;
          return JSON.stringify(obj, Object.getOwnPropertyNames(obj));
        } catch {
          return util.inspect(obj, { depth: 4 });
        }
      };

      console.error("[ROUTE] /upload/both error:", error);

      res.status(500).json({
        error: "Failed to upload files",
        message: error instanceof Error ? error.message : safeStringify(error),
      });
    }
  }
);

// POST /upload/folder
// Upload một folder có sẵn lên IPFS với metadata
router.post("/folder", async (req, res) => {
  try {
    console.log("[ROUTE] /upload/folder called");

    const { folderPath, customName, trackFileName, coverFileName, metadata } = req.body;

    if (!folderPath) {
      return res.status(400).json({
        error: "folderPath is required",
        example: {
          folderPath: "C:\\path\\to\\your\\folder",
          customName: "my-music-collection", // optional
          trackFileName: "track.mp3", // required if metadata provided
          coverFileName: "cover.jpg", // required if metadata provided
          metadata: { // optional
            name: "Music NFT #1",
            description: "Description",
            artist: "Artist Name",
            duration: "3:25",
            format: "MP3",
            external_url: "https://example.com",
            customAttributes: [
              { trait_type: "Genre", value: "Lo-fi" }
            ]
          }
        }
      });
    }

    const ipfsService = createIPFSService();

    // Nếu có metadata, upload với metadata
    if (metadata && trackFileName && coverFileName) {
      const result = await ipfsService.uploadFolderWithMetadata(
        folderPath,
        trackFileName,
        coverFileName,
        metadata,
        customName
      );

      return res.json({
        success: true,
        ...result,
      });
    }

    // Nếu không có metadata, upload folder thông thường
    const result = await ipfsService.uploadFolder(folderPath, customName);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    const safeStringify = (obj: unknown) => {
      try {
        if (typeof obj === "string") return obj;
        return JSON.stringify(obj, Object.getOwnPropertyNames(obj));
      } catch {
        return util.inspect(obj, { depth: 4 });
      }
    };

    console.error("[ROUTE] /upload/folder error:", error);

    res.status(500).json({
      error: "Failed to upload folder",
      message: error instanceof Error ? error.message : safeStringify(error),
    });
  }
});

// POST /upload
// New endpoint for uploading music NFT with auto-generated metadata
router.post(
  "/",
  upload.fields([
    { name: "track", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  async (req, res) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files.track || !files.track[0]) {
      return res.status(400).json({ error: "No track file provided" });
    }
    if (!files.cover || !files.cover[0]) {
      return res.status(400).json({ error: "No cover file provided" });
    }

    try {
      console.log("[ROUTE] POST /upload called");

      const { prompt, username, name, token_id, external_url } = req.body;

      // Validate required fields
      if (!prompt) {
        return res.status(400).json({ error: "prompt is required" });
      }
      if (!username) {
        return res.status(400).json({ error: "username is required" });
      }

      const ipfsService = createIPFSService();

      // Create temp files
      const trackPath = path.join(os.tmpdir(), files.track[0].originalname);
      const coverPath = path.join(os.tmpdir(), files.cover[0].originalname);

      fs.writeFileSync(trackPath, files.track[0].buffer);
      fs.writeFileSync(coverPath, files.cover[0].buffer);

      try {
        // Upload music NFT with auto-generated metadata
        const result = await ipfsService.uploadMusicNFTWithMetadata(
          trackPath,
          coverPath,
          prompt,
          username,
          token_id, // Optional, will generate UUID if not provided
          external_url, // Optional
          name // Optional custom name
        );

        // Cleanup temp files
        fs.unlinkSync(trackPath);
        fs.unlinkSync(coverPath);

        // Add tokenURI to response (for NFT minting)
        const responseWithTokenURI = {
          ...result,
          tokenURI: result.metadataUrl, // ipfs://{CID}/metadata.json
          tokenURIGateway: result.metadataUrl.replace('ipfs://', 'https://w3s.link/ipfs/')
        };

        res.json(responseWithTokenURI);
      } catch (error) {
        // Cleanup on error
        if (fs.existsSync(trackPath)) fs.unlinkSync(trackPath);
        if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
        throw error;
      }
    } catch (error) {
      const safeStringify = (obj: unknown) => {
        try {
          if (typeof obj === "string") return obj;
          return JSON.stringify(obj, Object.getOwnPropertyNames(obj));
        } catch {
          return util.inspect(obj, { depth: 4 });
        }
      };

      console.error("[ROUTE] POST /upload error:", error);

      res.status(500).json({
        error: "Failed to upload music NFT",
        message: error instanceof Error ? error.message : safeStringify(error),
      });
    }
  }
);

// POST /mint/prepare
// Generate tokenURI for NFT minting
router.post("/mint/prepare", async (req, res) => {
  try {
    console.log("[ROUTE] POST /mint/prepare called");

    const { metadataCid, folderCid } = req.body;

    if (!metadataCid && !folderCid) {
      return res.status(400).json({
        error: "Either metadataCid or folderCid is required",
        example: {
          metadataCid: "QmXXXXXX...",
          // OR
          folderCid: "QmYYYYYY...",
        },
      });
    }

    let tokenURI: string;

    if (metadataCid) {
      // If metadata CID is provided directly
      tokenURI = `ipfs://${metadataCid}`;
    } else {
      // If folder CID is provided, append metadata.json
      tokenURI = `ipfs://${folderCid}/metadata.json`;
    }

    res.json({
      success: true,
      tokenURI: tokenURI,
      gatewayUrl: tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/"),
    });
  } catch (error) {
    const safeStringify = (obj: unknown) => {
      try {
        if (typeof obj === "string") return obj;
        return JSON.stringify(obj, Object.getOwnPropertyNames(obj));
      } catch {
        return util.inspect(obj, { depth: 4 });
      }
    };

    console.error("[ROUTE] POST /mint/prepare error:", error);

    res.status(500).json({
      error: "Failed to prepare mint",
      message: error instanceof Error ? error.message : safeStringify(error),
    });
  }
});

export default router;
