import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from project root
dotenv.config({
  path: path.join(__dirname, '../.env')
});

import express from 'express';
import uploadRouter from './routes/upload.js';


const app = express();
const PORT = process.env.PORT || 3000;

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/upload', uploadRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'IPFS Upload Service' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📤 Upload endpoints:`);
  console.log(`   POST /upload - Upload music NFT with auto-generated metadata`);
  console.log(`   POST /upload/track - Upload audio track`);
  console.log(`   POST /upload/cover - Upload cover image`);
  console.log(`   POST /upload/both - Upload both track and cover`);
  console.log(`   POST /upload/folder - Upload existing folder`);
  console.log(`   POST /upload/mint/prepare - Generate tokenURI for NFT minting`);

  // Check if Storacha email is configured
  if (process.env.STORACHA_EMAIL && process.env.STORACHA_EMAIL.trim()) {
    console.log(`\n✅ Storacha email is configured: ${process.env.STORACHA_EMAIL}`);
    console.log(`📧 On first run, check your email for verification link`);
  } else {
    console.log(`\n⚠️  Warning: Storacha email is not set!`);
    console.log(`Please set STORACHA_EMAIL in your .env file.`);
    console.log(`Sign up at: https://console.storacha.network/`);
  }
});
