# VaultBox

VaultBox is a full‑stack password vault that stores encrypted entries and decrypts them client‑side after login. The backend holds only encrypted payloads and vault key material, while the frontend derives and uses keys in memory to read/write entries.

**Tech Stack**
- Frontend: React + Vite + Tailwind
- Backend: Express + MongoDB (Mongoose)
- Crypto: Web Crypto + Argon2 (via `hash-wasm`)

**Project Structure**
- `frontend/` React app and UI
- `backend/` Express API and data models

## Setup

### 1) Backend
1. Create `backend/.env`:
   - `NODE_ENV=development`
   - `PORT=3000`
   - `MONGODB_URI=...`
   - `JWT_SECRET=...`
   - `COOKIE_SECRET=...`
   - `JWT_EXPIRES_IN_SEC=...`
   - `REFRESH_TOKEN_EXPIRES_IN_SEC=...`
2. Install deps and run:
   - `cd backend`
   - `npm install`
   - `npm run dev`

### 2) Frontend
1. Install deps and run:
   - `cd frontend`
   - `npm install`
   - `npm run dev`

The frontend expects the API at `http://localhost:3000` and the backend allows CORS from `http://localhost:5173`.

## Notes
- Entries are encrypted client‑side and stored as `{ cipherText, iv }` in the vault.
- Auth state (access token + key material) lives in the auth context for the session only.
