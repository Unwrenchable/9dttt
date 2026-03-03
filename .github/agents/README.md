# 🎮 9DTTT — Agent Context Pack

> **Classification: ALL AGENTS**
> This directory contains repo-local context files that orient AI coding
> assistants to the **9DTTT** gaming platform. Read this file first before
> making any changes.

---

## What Is This Repository?

**9DTTT** is a full-stack multiplayer gaming platform with 31 browser-based games,
real-time multiplayer via Socket.io, a multi-chain Web3 wallet integration
(XRP / Solana / Ethereum), leaderboards, achievements, and a crypto education
game (Crypto Quest).

**Live site**: https://d9ttt.com  
**GitHub**: https://github.com/Unwrenchable/9dttt

This is **NOT** a DEX, swap protocol, or naming service. References to
"FizzSwap", "fizzdex", or a "Universal Naming Service" in older agent files
are **wrong** and must be ignored in favour of this file.

---

## Agent Files

| File | Role |
|------|------|
| `README.md` | **This file** — top-level orientation for all agents |
| `agent.md` | Repo structure, toolchain, conventions — read before every change |
| `bootstrap.md` | Step-by-step local setup guide |
| `fullstack-dev.md` | Full-stack master agent with complete project context |
| `web3-specialist.md` | XRP / Solana / Ethereum wallet integration expert |
| `games-master.yml` | Game logic, multiplayer, and mechanics specialist |
| `game-tester.md` | Master QA agent — simulates 1,000 worldwide players, finds bugs & exploits |
| `my-agent.agent.md` | Platform assistant — knows every game and feature |
| `memory.md` | Persistent decisions, gotchas, verified commands |
| `tasks.md` | **Active task queue — check before starting work on shared files** |

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│                      9DTTT Platform v2.0                       │
├──────────────────────────┬─────────────────────────────────────┤
│  FRONTEND (Vercel CDN)   │  BACKEND (Render)                   │
│  • Vanilla HTML/CSS/JS   │  • Node.js 20 + Express 4           │
│  • Public/ directory     │  • server.js (main entry)           │
│  • 31 browser games      │  • Socket.io multiplayer            │
│  • Multi-chain wallets   │  • JWT authentication               │
│  • Game UIs + chat       │  • Redis storage                    │
│                          │  • Rate limiting + Helmet           │
├──────────────────────────┴─────────────────────────────────────┤
│  BLOCKCHAIN (Multi-chain)            GAMES (31 total)          │
│  • XRP (xrpl library)               • Strategy: Chess, TTT    │
│  • Solana (@solana/web3.js)         • Action: Shooters, Brawlers│
│  • Ethereum (ethers.js)             • Puzzle: Sudoku, Mazes    │
│  • WalletConnect v2                 • Casino: Farkle, Backgammon│
│  • Multi-wallet UI                  • Education: Crypto Quest  │
└────────────────────────────────────────────────────────────────┘
```

---

## Repository Layout (Quick Reference)

```
/
├── server.js              # Main Express + Socket.io entry point
├── package.json           # Root package (Node.js backend)
├── vercel.json            # Vercel: serves Public/, rewrites /api/*
├── server/                # Server modules
│   ├── config.js          # Environment config (PORT, JWT_SECRET, etc.)
│   ├── auth.js            # JWT authentication
│   ├── browser-auth.js    # Browser-side auth helpers
│   ├── gameManager.js     # Core game logic, matchmaking, state
│   ├── storage.js         # Data persistence (Redis + in-memory)
│   ├── moderation.js      # Chat moderation, reports, bans
│   ├── security.js        # Rate limiting, bot protection
│   ├── monetization.js    # Cosmetics, ad rewards
│   ├── keepAlive.js       # Render keep-alive pings
│   └── boot.js            # Platform boot sequence
├── api/                   # REST API route handlers
│   ├── health.js          # GET /api/health
│   ├── stats.js           # GET /api/stats
│   ├── leaderboard.js     # GET /api/leaderboard
│   ├── auth/
│   │   ├── login.js       # POST /api/auth/login
│   │   └── wallet.js      # POST /api/auth/wallet
│   └── crypto-quest/
│       └── progress.js    # GET/POST /api/crypto-quest/progress
├── Public/                # Static frontend (served by Vercel in prod)
│   ├── index.html         # Main landing / game lobby
│   ├── 9dttt.html         # Ultimate Tic-Tac-Toe specific page
│   ├── games.html         # Game browser / download page
│   ├── admin.html         # Admin panel
│   ├── manifest.json      # PWA manifest
│   ├── games/             # 31 individual game HTML pages
│   └── js/                # Client-side JavaScript (55 files)
│       ├── game-engine.js         # Core game engine
│       ├── multiplayer-client.js  # Socket.io client
│       ├── multi-chain-wallet.js  # Multi-chain wallet integration
│       ├── unified-auth.js        # Unified authentication
│       ├── game-ui.js             # Game UI components
│       ├── leaderboard-ui.js      # Leaderboard display
│       ├── achievements.js        # Achievement system
│       ├── game-error-handler.js  # Centralized error handling
│       └── [game-specific].js     # Per-game logic files
└── scripts/               # Utility scripts (XRP testnet, bridge, etc.)
```

---

## The 31 Games

| Category | Games |
|----------|-------|
| **Strategy** | Ultimate Tic-Tac-Toe, 4D Chess, Connect Four, Crystal Connect, Thirteen |
| **Action / Combat** | Contra Commando, Dragon Fist, Monster Rampage, Tournament Fighters, Street Brawlers, Mega Heroes, FPS Arena |
| **Arcade / Shooter** | Carnival Shooter, Sky Ace Combat, Space Debris, Reflex Master, Pong, MotoGP Excite |
| **Puzzle / Brain** | Quantum Sudoku, Recursive Maze, Brain Age, Brain Academy, Memory Game, Dimensional Dice, Tide Turner |
| **Casino / Dice** | Farkle, Backgammon, Hangman, Beach Games |
| **Education** | Crypto Quest (5-level interactive game teaching blockchain concepts) |
| **Other** | Air Hockey |

---

## Key URLs

| Service | URL |
|---------|-----|
| Main platform | https://d9ttt.com |
| Backend API | https://d9ttt.com/api/ (same origin) |
| Health check | https://d9ttt.com/api/health |
| Admin panel | https://d9ttt.com/admin.html |

---

## Critical Conventions

1. **Frontend is VANILLA JS** — No React, no Vue, no TypeScript in `Public/`.
   Plain `.html` files with `<script src="...">` tags.
2. **Backend is CommonJS** — Use `require()` not `import`. No ES module syntax.
3. **Socket.io for multiplayer** — All real-time game events go through Socket.io.
   REST API is only for auth, leaderboards, and non-real-time data.
4. **JWT for auth** — All authenticated endpoints require a valid JWT in the
   `Authorization: Bearer <token>` header or `x-auth-token` header.
5. **Redis for storage** — `server/storage.js` wraps Redis with in-memory fallback.
6. **Multi-chain wallets** — XRP, Solana, and Ethereum wallets supported.
   Never hardcode chain assumptions. See `Public/js/multi-chain-wallet.js`.
7. **Security** — `server/security.js` enforces rate limits and bot protection.
   All Socket.io connections are rate-limited.
8. **No secrets in code** — Use `.env` files (git-ignored). Template: `.env.example`.

---

## Safety Rules

1. **Never store secrets** — No JWT secrets, wallet keys, API keys, or passwords
   in any `.github/agents/` file.
2. **Use `.env` files** (git-ignored) for all runtime secrets.
3. **Human review** — All `memory.md` additions require PR review before merge.
4. **No executable code** — These are documentation files only.
5. **Keep it factual** — Only record what is currently true of the repo.

---

## Memory Loop

```
Code change ──► update tasks.md (mark complete) ──► propose memory.md update ──► PR review ──► merge
```

Over time `memory.md` accumulates decisions, tested commands, and architecture
notes that make every subsequent AI interaction faster and more accurate.
`tasks.md` keeps in-flight work visible so agents don't step on each other.

---

*🎮 Read this document before modifying any file in the repository.*
*Game on. Play fair. Ship quality.*
