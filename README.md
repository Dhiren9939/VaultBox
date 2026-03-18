# VaultBox

VaultBox is a zero-knowledge password vault with a social recovery system.

Your secrets are encrypted in the browser before they ever touch the backend. If you lose your master password, VaultBox can recover access through trusted people and cryptographic shard reconstruction.

## Why This Exists

Most password managers force a brutal tradeoff:
- Recoverable account = provider can usually see too much.
- True privacy = forget password, lose everything.

VaultBox aims for both:
- End-to-end client-side encryption for vault data.
- Recovery path using trustee-held encrypted shards.
- No plaintext password entries stored server-side.

## Core Features

- Client-side vault encryption with `AES-GCM`.
- `Argon2id` key derivation in browser (`hash-wasm`).
- Dual-wrapped vault key material (`KEK` + `RKEK` paths).
- JWT auth with refresh-token rotation and secure cookies.
- Dead-drop inbox for shard exchange.
- Trustee/recovery center in dashboard.
- Full recovery flow with temporary session keys + shard contributions.

## Tech Stack

- Frontend: React 19, Vite, Tailwind CSS 4, Axios
- Backend: Node.js, Express 5, MongoDB, Mongoose
- Security/Crypto: Web Crypto API, Argon2id, RSA-OAEP, bcrypt

## Project Structure

```text
VaultBox/
  backend/    Express API, models, auth, recovery services
  frontend/   React app, crypto client, vault/recovery UI
```

## Quick Start

### 1) Backend setup

Create `backend/.env`:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
COOKIE_SECRET=your_cookie_secret
JWT_EXPIRES_IN_SEC=900
REFRESH_TOKEN_EXPIRES_IN_SEC=604800
```

Install and run:

```bash
cd backend
npm install
npm run dev
```

### 2) Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Default local URLs:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

Note: both frontend API base URL and backend CORS origin are currently hardcoded for local development (`localhost:3000` and `localhost:5173`).

## NPM Scripts

### Backend (`backend/package.json`)

- `npm run dev` - run API with nodemon and `.env`
- `npm run lint` - lint backend source
- `npm run lint:fix` - lint + autofix backend source

### Frontend (`frontend/package.json`)

- `npm run dev` - run Vite dev server
- `npm run build` - production build
- `npm run preview` - preview production build
- `npm run lint` - lint frontend source

## Security Model (High-Level)

- User password derives two keys with `Argon2id`:
  - `KEK` for normal vault unlock path.
  - `RKEK` for recovery path.
- Random `DEK` encrypts vault entries.
- Backend stores encrypted key material only:
  - `eDEK` (DEK encrypted by KEK)
  - `reDEK` (DEK encrypted by RKEK)
- Vault entries are encrypted/decrypted client-side.
- Recovery shards are encrypted for recipients using RSA public keys.
- Recovery session uses ephemeral RSA keypair and intermediate password.

## Recovery Flow Snapshot

1. User starts recovery with email + intermediate password.
2. Client generates ephemeral RSA keypair and sends encrypted private key metadata.
3. Trustees contribute encrypted shards to active recovery session.
4. Client pulls >= 3 shards, decrypts and reconstructs `RKEK` using interpolation.
5. Client decrypts DEK, rotates vault keys + credentials, and finalizes recovery.
6. Old shard distribution is purged after successful finalization.

Recovery sessions expire automatically after 3 days (Mongo TTL index on `expiresAt`).

## API Surface (By Module)

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/refresh`
- `POST /api/auth/logout`

### Vault

- `GET /api/vaults/key`
- `GET /api/vaults/entries`
- `POST /api/vaults/entries`
- `PUT /api/vaults/entries/:entryId`
- `DELETE /api/vaults/entries/:entryId`
- `POST /api/vaults/shard`

### Recovery

- `GET /api/recovery/trustees`
- `GET /api/recovery/trustors`
- `GET /api/recovery/requests`
- `DELETE /api/recovery/shards/:shardId`
- `POST /api/recovery/initiate`
- `POST /api/recovery/start`
- `GET /api/recovery/shards/:recoveryId`
- `POST /api/recovery/approve/:recoveryId`
- `POST /api/recovery/complete`
- `POST /api/recovery/cancel`

### Dead Drops

- `GET /api/dead-drops`
- `POST /api/dead-drops/:id`
- `DELETE /api/dead-drops/shards/:shardId`

### User

- `GET /api/users`
- `PUT /api/users`
- `DELETE /api/users`

## Current State

- No automated tests are wired yet.
- Linting is available in frontend and backend.
- Project is optimized for local/dev workflow right now.

## Hardening Ideas

- Move frontend API base URL and backend CORS origin to environment config.
- Add end-to-end tests for registration, vault CRUD, and recovery completion.
- Add rate limiting and abuse controls on auth and recovery endpoints.
- Add security headers and stricter cookie policies for production deploy.

## Contributing

1. Fork and clone.
2. Create a feature branch.
3. Run lint in both apps before opening a PR.
4. Include clear reproduction and validation steps.

## License

No license file is currently defined in this repository.
