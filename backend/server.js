import express from 'express';
import cors from 'cors';
import multer from 'multer';
import crypto from 'crypto';
import { ethers } from 'ethers';
import { DatabaseSync } from 'node:sqlite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT             = process.env.PORT || 5000;
const DATABASE_PATH    = process.env.DATABASE_PATH || './database/evidence.db';
const RPC_URL          = process.env.HARDHAT_NETWORK_URL || 'https://rpc-amoy.polygon.technology';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY      = process.env.PRIVATE_KEY;
const JWT_SECRET       = process.env.JWT_SECRET;
if (!JWT_SECRET) { console.error('FATAL: JWT_SECRET env var not set. Add it to backend/.env'); process.exit(1); }

const CONTRACT_ABI = [
  'function logEvidence(bytes32 _videoHash, string _cameraId, uint256 _timestamp) external',
  'function verifyEvidence(bytes32 _videoHash) external view returns (bool exists, uint256 timestamp, uint256 loggedAt, string cameraId)',
  'function getEvidence(bytes32 _videoHash) external view returns (tuple(bytes32 videoHash, string cameraId, uint256 timestamp, address uploader, uint256 blockNumber, uint256 loggedAt))',
  'function getEvidenceCount() external view returns (uint256 count)',
  'function getEvidenceHashAtIndex(uint256 _index) external view returns (bytes32 hash)',
  'event EvidenceLogged(bytes32 indexed videoHash, string cameraId, uint256 timestamp, address indexed uploader, uint256 blockNumber)',
];

// ─── Express ─────────────────────────────────────────────────────────────────
const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST'],
  credentials: true,
}));
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

// ─── SQLite (built-in node:sqlite) ───────────────────────────────────────────
const dbPath = path.resolve(__dirname, DATABASE_PATH);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS evidence_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_hash TEXT NOT NULL UNIQUE,
    camera_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    blockchain_tx TEXT,
    block_number INTEGER,
    uploader TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_video_hash ON evidence_log(video_hash);
  CREATE INDEX IF NOT EXISTS idx_status ON evidence_log(status);
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'analyst',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const stmtInsert = db.prepare(
  `INSERT INTO evidence_log (video_hash, camera_id, timestamp, status) VALUES (?, ?, ?, 'pending')`
);
const stmtConfirm = db.prepare(
  `UPDATE evidence_log SET status='confirmed', blockchain_tx=?, block_number=?, uploader=? WHERE video_hash=?`
);
const stmtFail = db.prepare(
  `UPDATE evidence_log SET status='failed' WHERE video_hash=?`
);
const stmtByHash = db.prepare(
  `SELECT * FROM evidence_log WHERE video_hash=?`
);
const stmtAll = db.prepare(
  `SELECT * FROM evidence_log ORDER BY created_at DESC`
);

// ─── Blockchain ───────────────────────────────────────────────────────────────
let provider, wallet, contract;

async function initBlockchain() {
  if (!PRIVATE_KEY || PRIVATE_KEY === 'YOUR_PRIVATE_KEY_HERE') {
    console.warn('WARNING: PRIVATE_KEY not set — blockchain features disabled');
    return false;
  }
  if (!CONTRACT_ADDRESS) {
    console.warn('WARNING: CONTRACT_ADDRESS not set — blockchain features disabled');
    return false;
  }
  try {
    provider = new ethers.JsonRpcProvider(RPC_URL);
    wallet   = new ethers.Wallet(PRIVATE_KEY, provider);
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
    const network = await provider.getNetwork();
    console.log(`Blockchain: chain ${network.chainId} | contract ${CONTRACT_ADDRESS} | wallet ${wallet.address}`);
    return true;
  } catch (err) {
    console.error('Blockchain init failed:', err.message);
    return false;
  }
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────
function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derived) => {
      if (err) reject(err);
      else resolve({ hash: derived.toString('hex'), salt });
    });
  });
}

function verifyPassword(password, hash, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derived) => {
      if (err) reject(err);
      else resolve(crypto.timingSafeEqual(Buffer.from(hash, 'hex'), derived));
    });
  });
}

function createToken(payload) {
  const header  = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body    = Buffer.from(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 * 7 })).toString('base64url');
  const sig     = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

function verifyToken(token) {
  try {
    const [header, body, sig] = token.split('.');
    const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

function authenticateToken(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const payload = verifyToken(auth.slice(7));
  if (!payload) return res.status(401).json({ error: 'Invalid or expired token' });
  req.user = payload;
  next();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function sha256hex(buffer) {
  return '0x' + crypto.createHash('sha256').update(buffer).digest('hex');
}

function isValidHash(h) {
  return /^0x[a-fA-F0-9]{64}$/.test(h);
}

function requireBlockchain(res) {
  if (!contract) {
    res.status(503).json({ success: false, error: 'Blockchain not connected. Set PRIVATE_KEY in backend/.env' });
    return false;
  }
  return true;
}

// ─── POST /api/auth/register ─────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password are required' });
  if (name.trim().length > 100)      return res.status(400).json({ error: 'Name too long' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return res.status(400).json({ error: 'Invalid email address' });
  if (password.length < 8)           return res.status(400).json({ error: 'Password must be at least 8 characters' });
  const validRoles = ['officer', 'analyst'];
  const userRole = validRoles.includes(role) ? role : 'analyst';

  try {
    const { hash, salt } = await hashPassword(password);
    db.prepare('INSERT INTO users (name, email, password_hash, salt, role) VALUES (?, ?, ?, ?, ?)').run(name.trim(), email.trim().toLowerCase(), hash, salt, userRole);
    const user = db.prepare('SELECT id, name, email, role FROM users WHERE email = ?').get(email.trim().toLowerCase());
    const token = createToken({ userId: user.id, email: user.email, role: user.role });
    return res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'Email already registered' });
    console.error('Register error:', err.message);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await verifyPassword(password, user.password_hash, user.salt);
    if (!valid)  return res.status(401).json({ error: 'Invalid credentials' });
    const token = createToken({ userId: user.id, email: user.email, role: user.role });
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(req.user.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ user });
});

// ─── POST /api/seed ───────────────────────────────────────────────────────────
const SEED_CAMERAS = [
  { id: 'CAM-001', label: 'Loodswezen Canal',         location: 'Rotterdam, Netherlands' },
  { id: 'CAM-002', label: 'Fair Harbor Marina',        location: 'Long Island, New York'  },
  { id: 'CAM-003', label: 'Opatovice Recreation Park', location: 'South Moravia, CZ'     },
  { id: 'CAM-004', label: 'Meishan Scenic Area',      location: 'Chiayi, Taiwan'         },
  { id: 'CAM-005', label: 'Yangmingshan Natl Park',   location: 'Taipei, Taiwan'         },
  { id: 'CAM-006', label: 'Anklam Town View',         location: 'Mecklenburg, Germany'   },
];

app.post('/api/seed', authenticateToken, async (req, res) => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const inserted = [];
    for (let i = 0; i < SEED_CAMERAS.length; i++) {
      const cam = SEED_CAMERAS[i];
      const fakePayload = Buffer.from(`${cam.id}-${cam.label}-seed-${Date.now()}-${Math.random()}`);
      const hash = sha256hex(fakePayload);
      const timestamp = now - (i * 3600);
      const blockNumber = 1200000 + Math.floor(Math.random() * 50000) + i * 100;
      const uploaderAddr = wallet?.address || '0x' + crypto.randomBytes(20).toString('hex');
      try {
        db.prepare('INSERT OR IGNORE INTO evidence_log (video_hash, camera_id, timestamp, blockchain_tx, block_number, uploader, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
          hash, cam.id, timestamp,
          '0x' + crypto.randomBytes(32).toString('hex'),
          blockNumber,
          uploaderAddr,
          'confirmed'
        );
        inserted.push({ cameraId: cam.id, videoHash: hash, blockNumber, timestamp });
      } catch (e) { /* skip duplicate */ }
    }
    return res.json({ success: true, inserted: inserted.length, records: inserted });
  } catch (err) {
    console.error('Seed error:', err.message);
    return res.status(500).json({ error: 'Seeding failed' });
  }
});

// ─── POST /api/record ────────────────────────────────────────────────────────
app.post('/api/record', authenticateToken, upload.single('video'), async (req, res) => {
  if (!req.file)           return res.status(400).json({ success:false, error:'No video file provided' });
  if (!requireBlockchain(res)) return;

  const cameraId = req.body.cameraId?.trim();
  if (!cameraId) return res.status(400).json({ success:false, error:'Camera ID is required' });
  if (!/^CAM-\d{3}$/.test(cameraId)) return res.status(400).json({ success:false, error:'Invalid camera ID' });

  const videoHash = sha256hex(req.file.buffer);
  const timestamp = Math.floor(Date.now() / 1000);

  console.log(`Record: hash=${videoHash} camera=${cameraId}`);

  const existing = stmtByHash.get(videoHash);
  if (existing) {
    return res.status(409).json({ success:false, error:'Evidence with this hash already exists', existing: { videoHash: existing.video_hash, cameraId: existing.camera_id, status: existing.status } });
  }

  try { stmtInsert.run(videoHash, cameraId, timestamp); }
  catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ success:false, error:'Evidence already exists in database' });
    throw e;
  }

  try {
    const tx      = await contract.logEvidence(videoHash, cameraId, timestamp);
    console.log(`TX submitted: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`TX confirmed: block ${receipt.blockNumber}`);
    stmtConfirm.run(receipt.hash, receipt.blockNumber, wallet.address, videoHash);

    return res.json({ success:true, videoHash, txHash:receipt.hash, blockNumber:receipt.blockNumber, cameraId, timestamp });
  } catch (err) {
    console.error('Blockchain error:', err.message);
    stmtFail.run(videoHash);
    if (err.message.includes('Evidence already exists')) return res.status(409).json({ success:false, error:'Evidence already exists on blockchain' });
    return res.status(500).json({ success:false, error:'Failed to record on blockchain' });
  }
});

// ─── POST /api/verify ────────────────────────────────────────────────────────
app.post('/api/verify', authenticateToken, upload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).json({ verified:false, error:'No video file provided' });
  if (!requireBlockchain(res)) return;

  const videoHash     = sha256hex(req.file.buffer);
  const cachedEvidence = stmtByHash.get(videoHash);

  console.log(`Verify: hash=${videoHash}`);

  try {
    const [exists] = await contract.verifyEvidence(videoHash);

    if (exists) {
      const evidence = await contract.getEvidence(videoHash);
      const result = {
        verified: true,
        source: cachedEvidence ? 'cache+blockchain' : 'blockchain',
        evidence: {
          videoHash:   evidence.videoHash,
          cameraId:    evidence.cameraId,
          timestamp:   Number(evidence.timestamp),
          uploader:    evidence.uploader,
          blockNumber: Number(evidence.blockNumber),
          loggedAt:    Number(evidence.loggedAt),
        },
      };
      if (!cachedEvidence) {
        try {
          stmtInsert.run(videoHash, evidence.cameraId, Number(evidence.timestamp));
          stmtConfirm.run(null, Number(evidence.blockNumber), evidence.uploader, videoHash);
        } catch {}
      }
      return res.json(result);
    }

    return res.json({
      verified: false,
      videoHash,
      message: cachedEvidence?.status === 'pending'
        ? 'Evidence found in cache but not yet confirmed on blockchain'
        : 'Evidence not found on blockchain',
    });

  } catch (err) {
    console.error('Blockchain verify error:', err.message);
    if (cachedEvidence?.status === 'confirmed') {
      return res.json({
        verified: true, source:'cache-only',
        warning: 'Blockchain verification failed, using cached data',
        evidence: { videoHash: cachedEvidence.video_hash, cameraId: cachedEvidence.camera_id, timestamp: cachedEvidence.timestamp, uploader: cachedEvidence.uploader, blockNumber: cachedEvidence.block_number },
      });
    }
    return res.status(500).json({ verified:false, error:'Blockchain verification failed' });
  }
});

// ─── GET /api/logs ────────────────────────────────────────────────────────────
function cachedRecords() {
  return stmtAll.all().map(r => ({
    videoHash:   r.video_hash,
    cameraId:    r.camera_id,
    timestamp:   r.timestamp,
    uploader:    r.uploader,
    blockNumber: r.block_number,
    status:      r.status,
  }));
}

app.get('/api/logs', authenticateToken, async (req, res) => {
  if (!contract) {
    const records = cachedRecords();
    return res.json({ success:true, source:'cache', warning:'Blockchain not connected — showing cached records only', count:records.length, records });
  }

  try {
    const count = Number(await contract.getEvidenceCount());
    console.log(`Fetching ${count} records from blockchain`);

    if (count === 0) {
      // Blockchain empty — serve SQLite cache (seeded demo data)
      const records = cachedRecords();
      return res.json({ success:true, source:'cache', count:records.length, records });
    }

    const records = [];
    for (let i = 0; i < count; i++) {
      try {
        const hash     = await contract.getEvidenceHashAtIndex(i);
        const evidence = await contract.getEvidence(hash);
        records.push({
          videoHash:   evidence.videoHash,
          cameraId:    evidence.cameraId,
          timestamp:   Number(evidence.timestamp),
          uploader:    evidence.uploader,
          blockNumber: Number(evidence.blockNumber),
          loggedAt:    Number(evidence.loggedAt),
        });
      } catch (e) {
        console.error(`Error at index ${i}:`, e.message);
      }
    }
    records.sort((a, b) => b.timestamp - a.timestamp);
    return res.json({ success:true, count:records.length, records });
  } catch (err) {
    console.error('Logs error:', err.message);
    const records = cachedRecords();
    return res.json({ success:true, source:'cache', warning:'Blockchain unavailable, showing cached records', count:records.length, records });
  }
});

// ─── GET /api/health ─────────────────────────────────────────────────────────
app.get('/api/health', authenticateToken, async (req, res) => {
  if (!contract) return res.json({ status:'degraded', blockchain:'disconnected', reason:'PRIVATE_KEY not configured' });
  try {
    const blockNumber = await provider.getBlockNumber();
    return res.json({ status:'ok', blockchain:'connected', blockNumber, contractAddress:CONTRACT_ADDRESS, network: RPC_URL });
  } catch (err) {
    return res.json({ status:'degraded', blockchain:'disconnected', error:err.message });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────
async function start() {
  // Seed default admin account if no users exist
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (userCount === 0) {
    try {
      const { hash, salt } = await hashPassword('admin1234');
      db.prepare('INSERT INTO users (name, email, password_hash, salt, role) VALUES (?, ?, ?, ?, ?)').run('Admin', 'admin@cctv.local', hash, salt, 'admin');
      console.log('Default admin account initialised');
    } catch (e) { console.error('Failed to create default admin:', e.message); }
  }

  const ready = await initBlockchain();
  if (!ready) console.warn('Server starting in degraded mode — add PRIVATE_KEY to backend/.env to enable blockchain features');

  app.listen(PORT, () => {
    console.log(`Backend: http://localhost:${PORT}`);
    console.log(`  POST /api/record | POST /api/verify | GET /api/logs | GET /api/health`);
    console.log(`  POST /api/auth/register | POST /api/auth/login | GET /api/auth/me | POST /api/seed`);
  });
}

start();
