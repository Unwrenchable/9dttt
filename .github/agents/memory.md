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

### [2026-03-23] game-error-handler.js — XSS via e.message in innerHTML
- **Root cause**: `historyListEl.innerHTML` was built with `${e.message}` raw,
  allowing a crafted JS error message containing `<script>` or `<img onerror>`
  to execute arbitrary JS in the error modal.
- **Fix**: Added `_escapeHtml(str)` helper; now uses `${this._escapeHtml(e.message)}`
  everywhere error content is rendered into innerHTML.

### [2026-03-23] crypto-quest.js — Zombie render loop (never terminates)
- **Root cause**: `render()` called `requestAnimationFrame(() => this.render())`
  unconditionally with no stop flag and no RAF ID stored. Loop persisted for the
  lifetime of the browser tab even after the game was complete.
- **Fix**: Added `this._rafId = null; this._running = false` to constructor.
  Added `_renderLoop()` that checks `this._running`. Added `stop()` method with
  `cancelAnimationFrame(this._rafId)`.

### [2026-03-23] brain-academy.js — Multiple untracked RAF loops + interval leak
- **Root cause**: Each mini-game (`startAsteroidMath`, `startTypingMaster`) created
  local RAF closure loops without storing the RAF ID. `backToMenu()` did not clear
  `_spawnInterval` or `_wordInterval`, causing ghost intervals after menu navigation.
- **Fix**: RAF IDs stored as `academy._rafId`; `backToMenu()` now cancels
  `_rafId`, `_spawnInterval`, and `_wordInterval`.

### [2026-03-23] game-engine.js — stop() missing cancelAnimationFrame
- **Root cause**: `requestAnimationFrame(...)` return value was discarded in
  `_gameLoop()`. `stop()` only set `this.running = false` with no RAF cancel,
  allowing one phantom frame to fire after stop. Also `_setupInput()` had no
  duplicate-call guard.
- **Fix**: `_gameLoop()` now stores `this._rafId`; `stop()` calls
  `cancelAnimationFrame(this._rafId)`; `_setupInput()` has `_inputSetup` guard.

### [2026-03-23] zelda-adventure.html — Unconditional gameLoop never cancels
- **Root cause**: `gameLoop()` called `requestAnimationFrame(ts=>this.gameLoop(ts))`
  unconditionally with no running flag and no stored RAF ID.
- **Fix**: Added `_running` flag and `_rafId` to `WastelandGame`; `gameLoop()`
  checks `_running` before scheduling next frame; `_onEnter()` restarts loop cleanly.

### [2026-03-23] mega-heroes.js — No ctx null-check + _rafId not cancelled on gameover
- **Root cause**: Constructor accessed `this.canvas.getContext('2d')` without
  null-checking canvas first. `_showGameOver()` created an overlay without
  cancelling the pending RAF.
- **Fix**: Added canvas and ctx null-checks; `_showGameOver()` now calls
  `cancelAnimationFrame(this._rafId)` before showing overlay.

### [2026-03-23] monster-rampage.js / mega-heroes.js / tournament-fighters.js — Missing setupInput() guard
- **Root cause**: `_setupInput()` / `setupInput()` had no `_inputSetup` guard,
  allowing stacked `window` keydown/keyup listeners on every game instantiation.
- **Fix**: Added `if (this._inputSetup) return; this._inputSetup = true;` at
  top of each `setupInput()` method and initialized `this._inputSetup = false`
  in constructors.

### [2026-03-23] contra-commando.js — No cancelAnimationFrame in gameOver()
- **Root cause**: `gameOver()` set `this.running = false` but the already-queued
  RAF fired one more frame. RAF ID was never stored.
- **Fix**: `gameLoop()` now stores `this._rafId`; `gameOver()` calls
  `cancelAnimationFrame(this._rafId)`.

### [2026-03-23] sky-ace-combat.js — _rafId orphaned on game over
- **Root cause**: `_showGameOver()` did not cancel the pending RAF before
  creating the overlay, leaving an orphaned frame in the RAF queue.
- **Fix**: `_showGameOver()` now cancels `_rafId` before overlay creation.

### [2026-03-23] quantum-sudoku.js — setInterval not cleared on page navigation
- **Root cause**: `timerInterval` was only cleared in `initGame()` (new game).
  If user navigated away mid-game, interval fired on dead DOM elements.
- **Fix**: Added `window.addEventListener('beforeunload', ...)` in constructor
  to clear `timerInterval` on page unload.

### [2026-03-23] 6 inline HTML games — Missing cancelAnimationFrame on game-over
- **Root cause**: `air-hockey.html`, `beach-games.html`, `dragon-fist.html`,
  `fps-arena.html`, `space-debris.html`, `motogp-excite.html` all set `this._rafId`
  but never called `cancelAnimationFrame` at game-over state transition.
- **Fix**: Each game's loop now calls `cancelAnimationFrame(this._rafId)` before
  returning on game-over state.

---

## Gotchas

- **`JWT_SECRET` must be set** — `server/config.js` throws on startup in
  production if the default insecure value is used. Always set in prod `.env`.
- **`REDIS_URL` format** — Must use `redis://` or `rediss://` protocol.
  HTTP/HTTPS URLs are rejected.
- **Keyboard input** — Never create or reset `keys` inside a game loop.
  Set it up once in the constructor with a `setupInput()` guard (`_inputSetup`).
- **Canvas `ctx`** — Always null-check `canvas.getContext('2d')` before use.
- **RAF lifecycle** — Always store `this._rafId = requestAnimationFrame(...)`.
  Call `cancelAnimationFrame(this._rafId)` in `stop()` and game-over handlers.
- **Event listeners** — Every `window.addEventListener` must have a matching
  `window.removeEventListener` in `destroy()`. Store bound handler references.
- **Timers** — All `setInterval`/`setTimeout` IDs must be stored and cleared
  in game-end handlers and `beforeunload` listeners.
- **Socket.io CORS** — Wildcard `*` only in `development`. Production uses
  explicit origin allowlist.
- **`server/keepAlive.js`** — Pings Render external URL to prevent spin-down.
  Set `RENDER_EXTERNAL_URL` env var for this to work.
- **XSS prevention** — Never use `innerHTML = untrustedContent`. Use
  `_escapeHtml()` helper or `textContent` for user-influenced strings.

---

## AAA Quality Checklist (Per Game)

Every game should meet these standards before shipping:

- [ ] `this.keys = {}` initialized ONLY in constructor, never in loop
- [ ] `setupInput()` has `_inputSetup` guard preventing duplicate listeners
- [ ] `this._rafId = requestAnimationFrame(...)` — RAF ID always stored
- [ ] `cancelAnimationFrame(this._rafId)` called in `stop()` and game-over
- [ ] Canvas and ctx null-checked in constructor
- [ ] `removeEventListener` mirrors for all `addEventListener` calls
- [ ] `setInterval`/`setTimeout` cleared on game end and `beforeunload`
- [ ] Game rejects moves when `gameOver === true`
- [ ] `reset()` cleanly clears ALL state (no ghost state)
- [ ] Pause/resume on `Escape` key
- [ ] Game-over screen with clear restart path
- [ ] Mobile-responsive canvas sizing
- [ ] Back/Home navigation button present
- [ ] Consistent title format: "[Game Name] — 9DTTT"

_Add new entries above the relevant section. Keep entries concise._
_This file is version-controlled — never add secrets or credentials._
