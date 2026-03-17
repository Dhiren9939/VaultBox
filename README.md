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

## Security Architecture
- **KDF**: Argon2id is used to derive two Key Encryption Keys (KEK and rKEK) from the user's password using `kSalt` and `rSalt`.
- **Key Material**: 
  - `eDEK`: Data Encryption Key encrypted with `KEK` using `kIv`.
  - `reDEK`: Same Data Encryption Key encrypted with `rKEK` using `rIv`.
- **Entries**: Encrypted client-side using the `DEK` and stored as `{ cipherText, eIv }`.
- **Session**: Auth state and decrypted `DEK` are kept in memory only.
