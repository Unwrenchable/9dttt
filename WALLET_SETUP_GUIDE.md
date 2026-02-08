# 🔐 Wallet Authentication Setup Guide

## Overview

The 9DTTT platform now supports multi-chain wallet authentication for **XRP**, **Solana (SOL)**, and **Ethereum (ETH)**. Players can sign in using their crypto wallets to track progress, earn rewards, and maintain their game statistics across sessions.

## Supported Wallets

### 🦊 Ethereum (ETH)
- **MetaMask** - Browser extension wallet (Desktop)
- **WalletConnect** - Mobile wallet support (iOS/Android)
- **Coinbase Wallet** - Via WalletConnect
- **Trust Wallet** - Via WalletConnect
- **Rainbow Wallet** - Via WalletConnect

### 👻 Solana (SOL)
- **Phantom** - Browser extension and mobile app
- **Solflare** - Browser extension
- **Backpack** - Browser extension

### 💎 XRP Ledger
- **XUMM** - Mobile and web wallet
- **Crossmark** - Browser extension

## How It Works

### 1. **Player Signs In**
   - Player clicks "Connect Wallet" on the game platform
   - Selects their preferred blockchain (ETH, SOL, or XRP)
   - Connects their wallet (browser extension or mobile via QR code)
   - Signs a message to prove wallet ownership
   
### 2. **Authentication**
   - Signature is verified by the backend server
   - User account is created or retrieved (linked to wallet address)
   - JWT token is issued for session management
   - Wallet connection is persisted across sessions

### 3. **Progress Tracking**
   - Game progress is saved to the backend database
   - Player stats (wins, losses, scores) are tracked
   - Rewards and achievements are associated with wallet address
   - Data syncs across devices when logged in with same wallet

## Installation Instructions

### For Players

#### Desktop (Browser Extension)
1. **Ethereum**: Install [MetaMask](https://metamask.io)
2. **Solana**: Install [Phantom](https://phantom.app)
3. **XRP**: Install [Crossmark](https://crossmark.io)

#### Mobile
1. **All Chains**: Use WalletConnect for mobile wallet support
2. **Ethereum**: Install MetaMask, Trust Wallet, or Rainbow
3. **Solana**: Install Phantom mobile app
4. **XRP**: Install [XUMM](https://xumm.app)

### For Developers

#### 1. Install Dependencies
```bash
npm install
```

Required packages (already in package.json):
- `ethers` - Ethereum interaction
- `@solana/web3.js` - Solana interaction
- `xrpl` - XRP Ledger interaction
- `tweetnacl` - Solana signature verification
- `bs58` - Base58 encoding for Solana
- `@walletconnect/web3-provider` - WalletConnect support

#### 2. Environment Variables
Create a `.env` file:
```env
# Server Configuration
PORT=3000
NODE_ENV=production

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

# Database (optional - defaults to in-memory)
REDIS_URL=redis://localhost:6379
MONGODB_URI=mongodb://localhost:27017/9dttt

# WalletConnect Project ID (get from https://cloud.walletconnect.com)
WALLETCONNECT_PROJECT_ID=your_project_id_here
```

#### 3. Start the Server
```bash
npm start
```

## API Endpoints

### Wallet Authentication
```http
POST /api/auth/wallet
Content-Type: application/json

{
  "chain": "ethereum|solana|xrp",
  "address": "0x...|pubkey...|rXXX...",
  "signature": "0x...",
  "message": "Sign in to 9DTTT\nNonce: abc123",
  "wallet": "MetaMask|Phantom|XUMM|Crossmark"
}

Response:
{
  "success": true,
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "username": "w_ethereum_...",
    "displayName": "MetaMask (0x1234...5678)",
    "wallet": "0x1234...5678",
    "chain": "ethereum",
    "stats": { ... }
  }
}
```

### Save Progress
```http
POST /api/progress
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "game": "ultimate-tictactoe",
  "progress": { ... }
}
```

### Get Progress
```http
GET /api/progress/:game
Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "progress": { ... }
}
```

## Frontend Integration

### Basic Usage
```javascript
// Connect wallet
const result = await window.unifiedAuth.loginWithWallet('ethereum');
if (result.success) {
  console.log('Logged in!', result.user);
  console.log('Token:', result.token);
}

// Check if user is logged in
if (window.unifiedAuth.isLoggedIn()) {
  const user = window.unifiedAuth.getUser();
  console.log('Current user:', user);
}

// Logout
await window.unifiedAuth.logout();
```

### Save/Load Game Progress
```javascript
// Save progress
async function saveProgress(gameId, progressData) {
  const response = await fetch(`/api/progress`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...window.unifiedAuth.getAuthHeader()
    },
    body: JSON.stringify({
      game: gameId,
      progress: progressData
    })
  });
  return await response.json();
}

// Load progress
async function loadProgress(gameId) {
  const response = await fetch(`/api/progress/${gameId}`, {
    headers: window.unifiedAuth.getAuthHeader()
  });
  return await response.json();
}
```

## Security Features

### Signature Verification
- **Ethereum**: Uses `ethers.verifyMessage()` to validate signatures
- **Solana**: Uses TweetNaCl to verify ed25519 signatures
- **XRP**: Validates transaction signatures via xrpl library

### Token Security
- JWT tokens with configurable expiration
- HTTP-only cookies option for enhanced security
- Wallet address is hashed in username to prevent enumeration

### Rate Limiting
- Login attempts are rate-limited
- API endpoints have request throttling
- DDoS protection via express-rate-limit

## Troubleshooting

### "Wallet not found"
- **Solution**: Install the appropriate wallet extension for your chain
- **Mobile**: Use WalletConnect instead of direct connection

### "Signature verification failed"
- **Solution**: Make sure you're signing the exact message provided
- Check that the wallet is on the correct network (mainnet/testnet)

### "Connection lost"
- **Solution**: Wallet connections may expire after inactivity
- Simply reconnect your wallet to restore the session

### "Progress not saving"
- **Solution**: Ensure you're logged in with a wallet (not as guest)
- Check that authentication token is valid
- Verify backend API is running

## Testing

### Test Wallet Authentication
```bash
# Start server
npm start

# Open browser to http://localhost:3000
# Click "Connect Wallet"
# Select your preferred chain
# Approve the connection and sign the message
# You should see your wallet address displayed
```

### Test Progress Saving
```javascript
// In browser console after wallet login:
await saveProgress('test-game', { level: 5, score: 1000 });
const progress = await loadProgress('test-game');
console.log(progress); // Should show saved data
```

## Additional Resources

- [MetaMask Documentation](https://docs.metamask.io)
- [Phantom Documentation](https://docs.phantom.app)
- [XUMM Documentation](https://xumm.readme.io)
- [WalletConnect Documentation](https://docs.walletconnect.com)
- [Ethers.js Documentation](https://docs.ethers.org)
- [Solana Web3.js Documentation](https://solana-labs.github.io/solana-web3.js)
- [XRP Ledger Documentation](https://xrpl.org)

## Support

For issues or questions:
- Open an issue on GitHub
- Contact: [support@d9ttt.com](mailto:support@d9ttt.com)
- Join our Discord community

---

**Built with ❤️ by Bastion Quartet**  
Part of the Unwrenchable Ecosystem
