# VaultBox

[![Status](https://img.shields.io/badge/status-active-success)](https://github.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](https://github.com)
[![Node](https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/mongodb-database-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Security](https://img.shields.io/badge/security-client--side%20encryption-blue)](https://github.com)
[![License](https://img.shields.io/badge/license-unlicensed-lightgrey)](https://github.com)

VaultBox is a secure full-stack password manager built with React, Express, and MongoDB.

`react` `vite` `express` `mongodb` `tailwindcss` `argon2id` `jwt` `axios`

## Core Features

- Encrypted vault entries
- Authentication with access + refresh token flow
- Modern React dashboard UI
- MongoDB persistence with modular backend architecture

## Tech Stack

- Frontend: React 19, Vite, Tailwind CSS 4, Axios
- Backend: Node.js, Express 5, MongoDB, Mongoose
- Security/Crypto: Web Crypto API, Argon2id, bcrypt

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

Note: frontend API base URL and backend CORS origin are currently set for local development.

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

## Current State

- No automated tests are wired yet.
- Linting is available in frontend and backend.
- Project is optimized for local/dev workflow right now.

## Contributing

1. Fork and clone.
2. Create a feature branch.
3. Run lint in both apps before opening a PR.
4. Include clear reproduction and validation steps.

## License

No license file is currently defined in this repository.
