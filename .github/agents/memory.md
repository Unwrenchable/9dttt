# 🎮 9DTTT — Agent Memory

> **WARNING — NO SECRETS ALLOWED.**
> This file is committed to version control. It must never contain private
> keys, JWT secrets, API keys, passwords, wallet credentials, or any other
> sensitive values. Use `.env` files for secrets.

All additions must be reviewed in a pull request before merging to `main`.

---

## Project Identity

**9DTTT** is a full-stack multiplayer gaming platform with 31 browser-based
games at **https://d9ttt.com**.

**NOT** a DEX, swap protocol, naming service, or Atomic Fizz Caps game.
References to "FizzSwap", "fizzdex", "AtomicFizzCaps naming service", or
"supremegoggles" in older agent files are **wrong** and must be ignored.

---

## Toolchain Decisions

_(Newest first within each section)_

- **Node.js 20 LTS** — selected for long-term support; matches Render runtime.
- **CommonJS (`require()`/`module.exports`)** — entire backend uses CommonJS.
  Do not introduce ES module `import` in server or api files.
- **Vanilla HTML/CSS/JS frontend** — no framework, no TypeScript, no build step.
  Editing `Public/` files takes effect immediately on browser refresh.
- **Socket.io 4.7** — chosen for real-time multiplayer with room-based isolation
  and built-in reconnection support.
- **Redis + in-memory fallback** — `server/storage.js` wraps Redis; falls back
  to in-memory store when `REDIS_URL` is not set. Data lost on restart in fallback.
- **JWT + bcryptjs** — JWT for session tokens, bcrypt for password hashing.
  `JWT_SECRET` must be set in production or server hard-fails at startup.
- **xrpl, @solana/web3.js, ethers** — multi-chain wallet support in one platform.
- **express-rate-limit + custom security** — `server/security.js` applies
  per-socket rate limiting for game events.

---

## Commands That Worked

| Date | Command | Notes |
|------|---------|-------|
| — | `npm start` | Production server (port from `PORT` env var, default 3000) |
| — | `npm run dev` | Development server (same, no auto-reload unless using nodemon) |
| — | `curl http://localhost:3000/api/health` | Health check endpoint |
| — | `node server.js` | Direct start (same as `npm start`) |

---

## Architecture Notes

- **Frontend served from `Public/`** — Vercel serves this as a CDN.
  `vercel.json` at repo root configures static serving and API proxy.
- **Backend on Render** — `server.js` is the Express + Socket.io entry point.
  Health check: `GET /api/health`.
- **CORS** — Production allowlist: `d9ttt.com`, `9dttt.vercel.app`,
  `process.env.VERCEL_URL`, `process.env.FRONTEND_URL`. Localhost only in dev.
- **No build step for frontend** — Do not add webpack/vite without updating
  `vercel.json`.
- **Game state in `server/gameManager.js`** — All game logic, matchmaking,
  and state transitions live here. Socket.io event handlers in `server.js`
  delegate to `gameManager`.

---

## Bug Fixes Applied

### [2026-03-03] pong.html — Keyboard input completely broken
- **Root cause**: `handleInput()` called `const keys = {}` as a local variable
  on every animation frame, reassigning `document.onkeydown`/`onkeyup` to stale
  closures. Keystroke updates never reached the current frame's `keys` object.
- **Fix**: Moved `this.keys = {}` to constructor; extracted `setupInput()` with
  a `_inputSetup` guard; changed `handleInput()` to read `this.keys`.

### [2026-03-03] brain-age.js — Calculation 20 and Number Memory unplayable
- **Root cause**: `checkAnswer()` dispatched on `this.currentGame` but it was
  never updated from `null` when a sub-game started.
- **Fix**: Added `this.currentGame = 'calculation'` in `startCalculation20()`
  and `this.currentGame = 'counting'` in `startNumberMemory()`.

### [2026-03-03] crypto-quest.html — `closeInfo()` not defined
- **Root cause**: `<button onclick="closeInfo()">` existed but no `closeInfo`
  function was defined anywhere.
- **Fix**: Added `closeInfo()` inline function in the page's `<script>` block.

### [2026-03-03] thirteen.html — Play-type label silently missing from UI
- **Root cause**: `renderPlayArea()` in `thirteen.js` wrote to `#play-type`
  but that element was absent from the HTML (null-check prevented crash but
  suppressed the display).
- **Fix**: Added `<span id="play-type">` inside `.last-play` container.

---

## Gotchas

- **`JWT_SECRET` must be set** — `server/config.js` throws on startup in
  production if the default insecure value is used. Always set in prod `.env`.
- **`REDIS_URL` format** — Must use `redis://` or `rediss://` protocol.
  HTTP/HTTPS URLs are rejected.
- **Keyboard input** — Never create or reset `keys` inside a game loop.
  Set it up once in the constructor with a `setupInput()` guard.
- **Canvas `ctx`** — Always null-check `canvas.getContext('2d')` before use.
- **Socket.io CORS** — Wildcard `*` only in `development`. Production uses
  explicit origin allowlist.
- **`server/keepAlive.js`** — Pings Render external URL to prevent spin-down.
  Set `RENDER_EXTERNAL_URL` env var for this to work.

---

_Add new entries above the relevant section. Keep entries concise._
_This file is version-controlled — never add secrets or credentials._
