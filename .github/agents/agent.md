# 🎮 9DTTT — Agent Guidance

Use this file to orient yourself before suggesting changes to the 9DTTT
gaming platform.

## Project overview

**9DTTT** is a full-stack multiplayer gaming platform with 31 browser-based
games, real-time multiplayer via Socket.io, multi-chain Web3 wallet integration
(XRP / Solana / Ethereum), leaderboards, achievements, and a crypto education
game (Crypto Quest).

**Live site**: https://d9ttt.com  
This is **NOT** a DEX, swap protocol, or naming service.

## Repository layout

```
/
├── server.js              # Main Express + Socket.io entry point
├── package.json           # Root package (Node.js backend, CommonJS)
├── vercel.json            # Vercel: serves Public/, rewrites /api/*
├── render.yaml            # Render: backend API service config
├── server/                # Server modules (CommonJS)
│   ├── config.js          # Environment config (PORT, JWT_SECRET, Redis, etc.)
│   ├── auth.js            # JWT authentication helpers
│   ├── browser-auth.js    # Browser-side auth helpers
│   ├── gameManager.js     # Core game logic, matchmaking, game state
│   ├── storage.js         # Data persistence (Redis + in-memory fallback)
│   ├── moderation.js      # Chat moderation, reports, disciplinary actions
│   ├── security.js        # Rate limiting, bot protection, input sanitization
│   ├── monetization.js    # Cosmetics, ad rewards system
│   ├── keepAlive.js       # Render keep-alive pings
│   ├── firebase.js        # Firebase integration (optional)
│   └── boot.js            # Platform boot sequence
├── api/                   # REST API route handlers
│   ├── health.js          # GET /api/health
│   ├── stats.js           # GET /api/stats
│   ├── leaderboard.js     # GET /api/leaderboard
│   ├── auth/
│   │   ├── login.js       # POST /api/auth/login
│   │   └── wallet.js      # POST /api/auth/wallet (multi-chain)
│   └── crypto-quest/
│       └── progress.js    # GET/POST /api/crypto-quest/progress
├── Public/                # Static frontend (Vanilla HTML/CSS/JS)
│   ├── index.html         # Main landing / game lobby
│   ├── 9dttt.html         # Ultimate Tic-Tac-Toe page
│   ├── games.html         # Game browser
│   ├── admin.html         # Admin panel
│   ├── manifest.json      # PWA manifest
│   ├── games/             # 31 individual game HTML pages
│   ├── css/               # Stylesheets (styles.css, game-ui.css, etc.)
│   └── js/                # Client-side JS (55+ files)
└── scripts/               # Utility scripts (XRP testnet, bridge check, etc.)
```

## Toolchain

| Layer | Tool |
|-------|------|
| Runtime | Node.js 20 LTS |
| Backend framework | Express 4 (CommonJS — `require()` only) |
| Real-time | Socket.io 4.7 |
| Frontend | Vanilla HTML5 / CSS3 / JavaScript — NO React, NO TypeScript |
| Database | Redis (via `REDIS_URL`) + in-memory fallback (`server/storage.js`) |
| Auth | JWT (`jsonwebtoken`), bcryptjs for password hashing |
| Blockchain | XRP (`xrpl`), Solana (`@solana/web3.js`), Ethereum (`ethers`) |
| Security | Helmet, `express-rate-limit`, custom `server/security.js` |
| Deployment | Vercel (frontend), Render (backend) |

## Root `package.json` scripts

```bash
npm start        # node server.js (production)
npm run dev      # node server.js (development)
npm run build    # echo 'Building for production' (no compile step)
npm run test     # echo 'Running tests...' (placeholder)
```

## Key conventions

- **CommonJS only** — `require()` / `module.exports` in all server files.
  No ES module `import` in backend code.
- **Vanilla JS frontend** — No framework, no build step. Edit `Public/` files
  and they take effect immediately on browser refresh.
- **Socket.io for multiplayer** — All real-time game events use Socket.io.
  REST API handles auth, leaderboards, and non-real-time data only.
- **JWT authentication** — Valid JWT required in `Authorization: Bearer <token>`
  or `x-auth-token` header for protected endpoints.
- **Redis with fallback** — `server/storage.js` uses Redis when `REDIS_URL` is
  set; falls back to in-memory store. Data is lost on restart with fallback.
- **Multi-chain wallets** — `Public/js/multi-chain-wallet.js` handles XRP,
  Solana, and Ethereum. Never hardcode a single chain.
- **No secrets in code** — Use `.env` files (git-ignored). See `server/config.js`
  for all expected environment variables.

## Things to watch out for

- **`JWT_SECRET` env var** — The server hard-fails on startup if `NODE_ENV=production`
  and `JWT_SECRET` is still the insecure default value. Always set this in prod.
- **`REDIS_URL` must be `redis://` or `rediss://`** — HTTP/HTTPS URLs will be
  rejected. Leave blank to use in-memory fallback.
- **No build step for frontend** — `Public/` is served as static files. Do not
  add webpack/vite without updating `vercel.json`.
- **Socket.io rate limiting** — `server/security.js` limits connections and
  events per socket. Don't bypass these guards.
- **CORS allowlist** — Production allows `d9ttt.com`, `9dttt.vercel.app`,
  and env-configured origins. Localhost is only allowed in development.
