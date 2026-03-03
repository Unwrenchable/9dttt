# 🎮 9DTTT — Local Bootstrap Guide

Follow these steps to run the 9DTTT gaming platform locally. All commands run
from the **repo root** unless noted otherwise.

> **No secrets in this file.** Copy `.env.example` to `.env` and fill in your
> own values. Never commit `.env` files.

---

## Prerequisites

| Tool | Minimum Version | Install |
|------|----------------|---------|
| Node.js | 20 LTS | https://nodejs.org or `nvm install 20` |
| npm | 9+ | Bundled with Node 20 |
| Git | any recent | https://git-scm.com |
| Redis | 6+ (optional) | https://redis.io or use Upstash cloud |

Redis is optional — the server falls back to in-memory storage if `REDIS_URL`
is not set. Data is lost on server restart without Redis.

---

## 1 — Install Dependencies

```bash
# From repo root
npm install
```

---

## 2 — Environment Variables

```bash
# Copy the example env file
cp .env.example .env
# Edit .env with your values — NEVER commit this file
```

Key variables for local development:

```bash
PORT=3000
NODE_ENV=development
JWT_SECRET=any-long-random-string-for-local-dev

# Optional — leave blank to use in-memory storage
REDIS_URL=redis://localhost:6379

# Optional — multi-chain wallet RPC
INFURA_KEY=your_infura_key
ALCHEMY_API_KEY=your_alchemy_key

# Optional — Render keep-alive (leave blank locally)
RENDER_EXTERNAL_URL=

# Maintenance mode (set to 'true' to enable)
MAINTENANCE_MODE=false
```

> ⚠️ **Important**: In production, `JWT_SECRET` **must** be set to a strong,
> unique random string. The server throws on startup if the default insecure
> value is used in production.

---

## 3 — Start the Development Server

```bash
npm start
# OR
node server.js
# Server starts at http://localhost:3000
```

The Express server also serves `Public/` as static files, so all game pages
are available at `http://localhost:3000/games/<name>.html`.

### Key URLs (local dev)

```
http://localhost:3000                         # Main lobby / landing page
http://localhost:3000/9dttt.html              # Ultimate Tic-Tac-Toe
http://localhost:3000/games/4d-chess.html     # 4D Chess
http://localhost:3000/games/crypto-quest.html # Crypto Quest
http://localhost:3000/games/farkle.html       # Farkle
http://localhost:3000/admin.html              # Admin panel
http://localhost:3000/api/health              # Health check
```

---

## 4 — Health Check

```bash
curl http://localhost:3000/api/health
# Should return: {"status":"ok", ...}
```

---

## 5 — Redis (Optional but Recommended)

```bash
# Option A: Local Redis via Homebrew (macOS)
brew install redis && brew services start redis

# Option B: Local Redis via Docker
docker run -d -p 6379:6379 redis:7-alpine

# Option C: Skip Redis (in-memory fallback)
# Leave REDIS_URL blank in .env.
# WARNING: All game state, leaderboards, and sessions are lost on restart.

# Option D: Cloud Redis (Upstash, Redis Cloud, etc.)
# Use the provided redis:// or rediss:// connection string in REDIS_URL
```

---

## 6 — Testing a Specific Game

Each game is a standalone HTML page that loads its own JS file. To test:

1. Navigate to `http://localhost:3000/games/<game-name>.html`
2. Verify the game loads without console errors
3. Play through at least one full round
4. Test keyboard input (arrow keys, WASD, Enter, Space)
5. Test on mobile viewport (Chrome DevTools device emulation)

---

## 7 — Socket.io Multiplayer Testing

To test multiplayer features, open two browser tabs or windows:

```
Tab 1: http://localhost:3000
Tab 2: http://localhost:3000
```

Both tabs connect to the same Socket.io server. Create a game in Tab 1, join
it in Tab 2. Watch for `gameUpdate` events in browser console.

---

## 8 — API Endpoints

```bash
# Health check
curl http://localhost:3000/api/health

# Leaderboard
curl http://localhost:3000/api/leaderboard

# Stats
curl http://localhost:3000/api/stats
```

Wallet auth requires a POST with signature payload — see `api/auth/wallet.js`.

---

## Quick-Reference Cheat Sheet

```bash
npm start               # Start server (http://localhost:3000)
npm run dev             # Same (no auto-reload by default)
node server.js          # Direct start

# Health check
curl http://localhost:3000/api/health | node -e "process.stdin||(x=>console.log(JSON.parse(x)))"

# Watch logs
node server.js 2>&1 | tee server.log

# Redis CLI (if running locally)
redis-cli ping          # Should return: PONG
redis-cli keys "*"      # List all keys
```

---

## Common Gotchas

| Problem | Solution |
|---------|---------|
| Server won't start in prod | `JWT_SECRET` must be set to a non-default value |
| `REDIS_URL` rejected | Must use `redis://` or `rediss://` protocol |
| Game page not found | Check filename in `Public/games/` — exact match required |
| Socket.io CORS error | Ensure `NODE_ENV=development` for local; add origin to allowlist |
| Wallet connect fails | Ensure browser has Phantom (Solana) or MetaMask (ETH) extension |
| Game loop not running | Check browser console for `canvas` or `ctx` null errors |
| Keyboard not working | Verify `setupInput()` called once in constructor, not in the loop |
