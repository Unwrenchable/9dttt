# 9DTTT Game Platform 

<div align="center">

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    ██████╗  █████╗ ███████╗████████╗██╗ ██████╗ ███╗   ██╗   ║
║    ██╔══██╗██╔══██╗██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║   ║
║    ██████╔╝███████║███████╗   ██║   ██║██║   ██║██╔██╗ ██║   ║
║    ██╔══██╗██╔══██║╚════██║   ██║   ██║██║   ██║██║╚██╗██║   ║
║    ██████╔╝██║  ██║███████║   ██║   ██║╚██████╔╝██║ ╚████║   ║
║    ╚═════╝ ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝   ║
║                                                              ║
║              Q U A R T E T   S T U D I O S                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

**A Bastion Quartet Production**

*Strategic multiplayer gaming platform featuring accessible and competitive games*

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

</div>

---

## 🎮 About

**Version 2.0 - Full Stack Edition** 🚀

9DTTT (Nine Dimensional Tic-Tac-Toe Tournament Tournament Tournament) has evolved into a comprehensive full-stack game platform featuring 31 games, complete backend API, and real interactive educational experiences.

### 🆕 What's New in v2.0

#### Full-Stack Architecture
- ✅ **Vercel-Ready Deployment** - One-command serverless deployment
- ✅ **Real API Backend** - RESTful endpoints for auth, leaderboards, stats, and progress
- ✅ **Admin Dashboard** - Real-time platform monitoring at `/admin.html`
- ✅ **Cloud Sync** - Player progress saves across devices
- ✅ **JWT Authentication** - Secure login with guest mode fallback

#### Enhanced Crypto Quest Academy
Completely rebuilt with **actual interactive gameplay** instead of text screens:
- 🎮 **Mining Simulator** - Click-to-mine with real hashrate upgrades
- ⛓️ **Blockchain Builder** - Visually build and validate blockchain
- 👛 **Wallet Creator** - Generate realistic wallets with seed phrases
- 📈 **Trading Academy** - Live charts, buy/sell tokens, manage portfolio
- 🛡️ **Scam Detector** - Interactive quiz to identify crypto scams
- 🎨 **NFT Studio** - Create and mint NFTs *(coming soon)*
- 💰 **DeFi Farming** - Stake and earn yield *(coming soon)*
- 🏛️ **DAO Builder** - Create governance proposals *(coming soon)*

### API Endpoints
```
GET  /api/health                   - Health check
GET  /api/stats                    - Platform statistics  
GET  /api/leaderboard              - Global leaderboard
POST /api/leaderboard              - Submit high score
POST /api/auth/login               - Login/register
GET  /api/crypto-quest/progress    - Load player progress
POST /api/crypto-quest/progress    - Save player progress
```

### Quick Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

See [README_DEPLOYMENT.md](README_DEPLOYMENT.md) for detailed deployment guide.

---

### Original Platform Description

**9DTTT** is a real-time multiplayer game platform developed by **Bastion Quartet**. Our mission is to create engaging, accessible, and strategic games that bring players together.

### Features

- 🎯 **Real-time Multiplayer** - Challenge friends or find opponents worldwide
- 💬 **In-Game Chat** - Communicate with opponents and the community
- 🏆 **Leaderboards** - Compete for the top spot
- 👤 **Player Profiles** - Custom avatars, stats tracking, and achievements
- 🖼️ **Avatar Uploads** - Upload your own profile picture (JPEG, PNG, GIF, WebP)
- 🔐 **Social Login** - Sign in with Google or Apple (FREE via Firebase)
- 🛡️ **Safe Community** - Comprehensive moderation and anti-abuse systems
- ♿ **Fully Accessible** - Keyboard navigation, screen reader support, and more
- 🎨 **Cosmetics** - Unlock avatar frames, board themes, and player icons
- 💰 **Player-Friendly Monetization** - Ad-free base experience with optional rewards

---

## 🎮 Current Games

### Ultimate Tic-Tac-Toe (9D TTT)

A strategic 9-board tic-tac-toe where your move determines your opponent's next board!

| Feature | Description |
|---------|-------------|
| **Players** | 2 |
| **Boards** | 9 mini-boards in a 3×3 grid |
| **Rule** | Your cell choice sends opponent to that board |
| **Scoring** | Points = moves in section when won (max 9 per section) |
| **Max Points** | 81 total (9 sections × 9 moves) |
| **Win Condition** | Most points when all sections complete |

### Coming Soon
- 🎲 4D Chess
- 🧩 Quantum Sudoku  
- 🎯 Dimensional Dice
- 🌀 Recursive Maze
- 🔮 Crystal Connect

---

## 🚀 Quick Start

### Deploy to Render (Recommended)

1. Fork this repository
2. Create a new Web Service on [Render](https://render.com)
3. Connect your GitHub repo
4. Configure:
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free (or higher for production)
5. Add environment variables (see below)
6. Deploy!

### Local Development

```bash
# Clone the repository
git clone https://github.com/Unwrenchable/9dttt.git
cd 9dttt

# Install dependencies
npm install

# Start the server
npm start

# Visit http://localhost:3000
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 3000) | No |
| `NODE_ENV` | Environment (development/production) | No |
| `JWT_SECRET` | Secret for JWT tokens | Yes (production) |
| `REDIS_URL` | Redis connection URL for persistence | No |
| `RENDER_EXTERNAL_URL` | Your Render app URL (for keep-alive) | No |

### Firebase Authentication (FREE - Up to 50,000 users)

Firebase Authentication provides secure social login with **no extra fees**. It's completely free for up to 50,000 monthly active users.

**Supported Sign-In Methods:**
- 🔍 Google Sign-In
- 🍎 Apple Sign-In
- 📧 Email/Password

#### Quick Setup (5 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (or select existing)
3. Go to **Authentication** → **Sign-in method**
   - Enable **Google** (click, enable, save)
   - Enable **Apple** (optional - requires Apple Developer account)
4. Go to **Project Settings** → **General** → **Your apps** → Click **Add app** → Select **Web**
5. Copy the config values to your `.env`:

```bash
# ✅ SAFE TO EXPOSE: These values are public by design
FIREBASE_API_KEY=AIzaSyD...
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
```

That's it! Players can now sign in with their Google or Apple accounts.

**Note:** Firebase API keys are meant to be public - see [OAUTH_SECURITY.md](./OAUTH_SECURITY.md) for explanation.

---

## 💰 Monetization

Our player-friendly monetization philosophy:

| Feature | Description |
|---------|-------------|
| **Base Experience** | Completely ad-free - no forced ads ever |
| **Rewarded Ads** | Optional: Watch ad → 1 hour ad-free, XP boost, or cosmetic |
| **Battle Pass** | Free, Premium ($4.99), Ultimate ($9.99) tiers |
| **Cosmetics** | Avatar frames, board themes, player icons |
| **Fair Play** | No pay-to-win - all purchases are cosmetic only |

### API Endpoints

```
GET  /api/monetization/status     - Check ad-free status & unlocks
POST /api/monetization/ad-reward  - Record ad view, receive reward
GET  /api/monetization/cosmetics  - List available cosmetics
POST /api/monetization/equip      - Equip a cosmetic item
POST /api/profile/avatar          - Upload custom avatar
DELETE /api/profile/avatar        - Reset to default avatar
```

---

## 🔒 Security

The platform implements comprehensive security measures:

### Headers & Protocols
| Security Feature | Implementation |
|------------------|----------------|
| **HTTPS** | Automatic redirect in production |
| **HSTS** | 1-year max-age with preload |
| **CSP** | Content Security Policy headers |
| **XSS** | X-XSS-Protection enabled |
| **Clickjacking** | X-Frame-Options: SAMEORIGIN |
| **MIME Sniffing** | X-Content-Type-Options: nosniff |
| **Referrer** | strict-origin-when-cross-origin |
| **Permissions** | Restrictive Permissions-Policy |
| **Cross-Origin** | COOP & CORP headers |

### Application Security
- ✅ Rate limiting on all endpoints
- ✅ Bot detection (timing analysis, honeypot fields)
- ✅ Input sanitization (iterative HTML tag removal)
- ✅ Failed login tracking with automatic lockout
- ✅ JWT token authentication
- ✅ CSRF protection for OAuth flows
- ✅ Password hashing with bcrypt (cost factor 10)

---

## 📁 Project Structure

```
9dttt/
├── Public/                    # Static frontend files
│   ├── index.html            # Main game library
│   ├── maintenance.html      # Maintenance page with mini-game
│   ├── css/                  # Stylesheets
│   ├── js/                   # Client-side JavaScript
│   └── games/                # Individual game pages
├── server/                   # Backend modules
│   ├── config.js            # Configuration
│   ├── storage.js           # Data persistence (Redis/Memory)
│   ├── auth.js              # Authentication & profiles
│   ├── oauth.js             # Social login (OAuth2)
│   ├── gameManager.js       # Game logic & matchmaking
│   ├── moderation.js        # Block, report, discipline
│   ├── security.js          # Rate limiting, bot protection, headers
│   ├── monetization.js      # Ads, cosmetics, battle pass
│   ├── keepAlive.js         # Prevent Render sleeping
│   └── boot.js              # ASCII boot sequence
├── server.js                # Main server entry point
├── package.json
├── render.yaml              # Render deployment config
└── README.md
```

---

## 🏗️ Architecture

### Backend
- **Express.js** - Web server and REST API
- **Socket.io** - Real-time multiplayer communication
- **Redis** - Optional persistence layer (falls back to in-memory)
- **JWT** - Secure authentication tokens
- **bcrypt** - Password hashing

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **CSS Custom Properties** - Easy theming
- **Progressive Enhancement** - Works without JavaScript for basic content

---

## ♿ Accessibility

All games include:
- ✅ Full keyboard navigation
- ✅ ARIA labels and roles
- ✅ Screen reader announcements
- ✅ High contrast mode
- ✅ Reduced motion preferences
- ✅ Mobile-responsive design
- ✅ Focus management

---

## 📱 Mobile App

This platform can be installed as an app:

### PWA (Progressive Web App)
Users can "Add to Home Screen" for an app-like experience with offline support.

### Native App (Capacitor)
```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add ios android
npx cap sync
```

**Note:** When running `npx cap init`, you'll be prompted for a package name (e.g., `com.example.app`). For Android apps, this package name becomes the `applicationId` in your app-level `build.gradle` file.

---

## 🛡️ Moderation

The platform includes comprehensive moderation tools:

| Feature | Description |
|---------|-------------|
| **Block Players** | Prevent all interactions with specific users |
| **Report System** | Report harassment, cheating, spam, inappropriate content |
| **Discipline Ladder** | Warning → Mute → Temp Ban → Permanent Ban |
| **Auto-Moderation** | Automatic action on multiple reports |

### Report Categories
- Harassment / Bullying
- Cheating / Exploits
- Spam / Flooding
- Inappropriate Content
- Other

---

## 📚 Documentation

- **[OAUTH_SECURITY.md](./OAUTH_SECURITY.md)** - Understanding OAuth security and why API keys in URLs are safe
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Fixing common issues with Google/Apple login
- **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** - Setting up Firebase authentication
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Deploying to production
- **[README_DEPLOYMENT.md](./README_DEPLOYMENT.md)** - Additional deployment information

---

## 📄 License

MIT License - Free to use and modify.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<div align="center">

**Built with ❤️ by Bastion Quartet**

*Strategic Gaming for Everyone*

[🎮 Play Now](https://ninedttt.onrender.com) • [🐛 Report Bug](https://github.com/Unwrenchable/9dttt/issues) • [💡 Request Feature](https://github.com/Unwrenchable/9dttt/issues)

</div>
