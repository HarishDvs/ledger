# LedgerEye — Blockchain CCTV Evidence Platform

A tamper-proof video evidence system that logs the SHA-256 hash of every CCTV recording onto an Ethereum-compatible blockchain. Once logged, footage integrity can be verified at any time — even years later — without storing the video itself on-chain.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│   Frontend      │────▶│   Backend API    │────▶│  EvidenceLog.sol    │
│  React + Vite   │     │  Node.js/Express │     │  Solidity (EVM)     │
│  Tailwind CSS   │     │  SQLite cache    │     │  Hardhat / Polygon  │
└─────────────────┘     └──────────────────┘     └─────────────────────┘
                                  ▲
                         ┌────────┴────────┐
                         │   AI Service    │
                         │ FastAPI + PyTorch│
                         │ OpenCV detection │
                         └─────────────────┘
```

| Layer | Tech | Purpose |
|---|---|---|
| Smart Contract | Solidity 0.8.28, Hardhat | Immutable on-chain hash ledger |
| Backend | Node.js 22+, Express, ethers.js, SQLite | REST API, auth, blockchain bridge |
| Frontend | React 18, Vite, Tailwind CSS | Dashboard, record, verify, live monitor |
| AI Service | Python 3.10+, FastAPI, PyTorch, OpenCV | Real-time crime detection & auto-upload |

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 22+ (uses built-in `node:sqlite`) |
| Python | 3.10+ |
| Git | any recent |

---

## Quick Start (Local Hardhat Sandbox)

### 1. Install root dependencies (Hardhat)

```bash
npm install
```

### 2. Start a local Hardhat node

```bash
npm run node
# Leave this terminal open — it mines blocks on demand
```

### 3. Deploy the smart contract

```bash
npm run deploy:local
# Note the printed contract address, e.g. 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### 4. Configure the backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
CONTRACT_ADDRESS=<address from step 3>
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80  # Hardhat account #0
JWT_SECRET=any-long-random-string
```

### 5. Start the backend

```bash
# still inside backend/
npm install
npm run dev
# API available at http://localhost:5000
```

### 6. Start the frontend

```bash
cd ../frontend
npm install
npm run dev
# UI available at http://localhost:5173
```

### 7. (Optional) Start the AI service

```bash
cd ../ai-service
cp .env.example .env   # edit if needed
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

---

## Environment Variables

### Root (Hardhat — for testnet/mainnet deployment only)

| Variable | Description |
|---|---|
| `DEPLOYER_PRIVATE_KEY` | Private key of the deploying wallet |
| `POLYGON_AMOY_RPC_URL` | RPC endpoint for Polygon Amoy testnet |

See `.env.example`.

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | HTTP port |
| `DATABASE_PATH` | `./database/evidence.db` | SQLite file path |
| `JWT_SECRET` | — | **Required.** Secret for signing JWT tokens |
| `HARDHAT_NETWORK_URL` | `http://127.0.0.1:8545` | RPC URL of the blockchain node |
| `CONTRACT_ADDRESS` | — | Deployed `EvidenceLog` contract address |
| `PRIVATE_KEY` | — | Wallet private key for submitting transactions |

See `backend/.env.example`.

### AI Service (`ai-service/.env`)

| Variable | Default | Description |
|---|---|---|
| `VIDEO_SOURCE` | `0` | Webcam index, RTSP URL, or file path |
| `CAMERA_ID` | `CAM-001` | Camera identifier sent with evidence |
| `DETECTION_THRESHOLD` | `0.6` | Confidence threshold (0–1) |
| `MODEL_DEVICE` | `cpu` | `cpu` or `cuda` |
| `BACKEND_URL` | `http://localhost:5000` | Backend API base URL |

See `ai-service/.env.example`.

---

## API Reference

All endpoints (except auth) require `Authorization: Bearer <token>`.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login, returns JWT |
| `GET` | `/api/auth/me` | Current user info |
| `POST` | `/api/record` | Upload video → hash → log on-chain |
| `POST` | `/api/verify` | Upload video → verify hash on-chain |
| `GET` | `/api/logs` | List all evidence records |
| `GET` | `/api/health` | Blockchain connection status |
| `POST` | `/api/seed` | Insert demo records (dev only) |

### Record evidence

```bash
curl -X POST http://localhost:5000/api/record \
  -H "Authorization: Bearer <token>" \
  -F "video=@clip.mp4" \
  -F "cameraId=CAM-001"
```

### Verify a clip

```bash
curl -X POST http://localhost:5000/api/verify \
  -H "Authorization: Bearer <token>" \
  -F "video=@clip.mp4"
```

---

## Smart Contract

`contracts/EvidenceLog.sol` stores a mapping of `bytes32 videoHash → Evidence` on any EVM chain.

```solidity
function logEvidence(bytes32 _videoHash, string calldata _cameraId, uint256 _timestamp) external;
function verifyEvidence(bytes32 _videoHash) external view returns (bool exists, ...);
function getEvidence(bytes32 _videoHash) external view returns (Evidence memory);
```

### Run tests

```bash
npm test
```

### Deploy to Polygon Amoy testnet

```bash
cp .env.example .env   # fill in DEPLOYER_PRIVATE_KEY and POLYGON_AMOY_RPC_URL
npx hardhat ignition deploy ./ignition/modules/EvidenceLog.ts --network amoy
```

---

## Default Credentials (local dev only)

A default admin account is seeded on first backend start:

| Field | Value |
|---|---|
| Email | `admin@cctv.local` |
| Password | `admin1234` |

**Change or delete this account before any production deployment.**

---

## Project Structure

```
Blockchain_CCTV/
├── contracts/          # Solidity smart contracts
├── ignition/           # Hardhat Ignition deploy modules
├── test/               # Contract unit tests
├── backend/            # Node.js REST API
│   ├── server.js
│   └── database/       # SQLite (auto-created)
├── frontend/           # React + Vite UI
│   └── src/
├── ai-service/         # Python AI detection service
│   └── app/
├── hardhat.config.ts
└── README.md
```

---

## License

ISC
