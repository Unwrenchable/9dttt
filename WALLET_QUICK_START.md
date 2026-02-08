# 🎮 Quick Start: Wallet Authentication

## For Players

### Desktop (Browser Extensions)

1. **Install a wallet extension:**
   - **Ethereum**: [MetaMask](https://metamask.io)
   - **Solana**: [Phantom](https://phantom.app)
   - **XRP**: [Crossmark](https://crossmark.io)

2. **Connect to 9DTTT:**
   - Visit [d9ttt.com](https://d9ttt.com)
   - Click "🔑 Sign In" button (top right)
   - Select "💎 Connect Wallet"
   - Choose your blockchain (XRP/SOL/ETH)
   - Approve the connection in your wallet
   - Sign the authentication message

3. **Start Playing:**
   - Your progress is now tracked
   - Stats sync across devices
   - Earn rewards tied to your wallet

### Mobile (WalletConnect)

1. **Install a mobile wallet:**
   - **All chains**: Trust Wallet, Rainbow, etc.
   - **Solana**: Phantom mobile app
   - **XRP**: XUMM mobile app

2. **Connect via QR code:**
   - Visit d9ttt.com on your phone or desktop
   - Click "💎 Connect Wallet" → "📱 WalletConnect"
   - Scan QR code with your wallet app
   - Approve the connection
   - Sign the authentication message

## For Developers

### Basic Integration

```javascript
// Wait for initialization
await window.unifiedAuth.init();

// Connect wallet
const result = await window.unifiedAuth.loginWithWallet('ethereum');
// Options: 'ethereum', 'solana', 'xrp', 'crossmark', 'walletconnect', 'auto'

if (result.success) {
  console.log('Logged in!', result.user);
  console.log('Token:', result.token);
}

// Check if logged in
if (window.unifiedAuth.isLoggedIn()) {
  const user = window.unifiedAuth.getUser();
  console.log('Welcome', user.displayName);
}
```

### Save/Load Game Progress

```javascript
// Save progress (requires authentication)
async function saveGameProgress(gameId, progressData) {
  const response = await fetch('/api/progress', {
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
async function loadGameProgress(gameId) {
  const response = await fetch(`/api/progress/${gameId}`, {
    headers: window.unifiedAuth.getAuthHeader()
  });
  return await response.json();
}

// Example usage
await saveGameProgress('ultimate-tictactoe', { 
  level: 5, 
  score: 1000,
  achievements: ['first_win', 'combo_master']
});

const progress = await loadGameProgress('ultimate-tictactoe');
console.log('Current level:', progress.level);
```

### Listen for Auth Changes

```javascript
// React to login/logout events
window.unifiedAuth.onAuthStateChanged((user) => {
  if (user) {
    console.log('User logged in:', user.displayName);
    updateUI(user);
  } else {
    console.log('User logged out');
    showLoginPrompt();
  }
});
```

## Testing

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start server
npm start

# 3. Open test page
open http://localhost:3000/wallet-test.html

# 4. Test wallet connections
# - Try each wallet type
# - Verify authentication works
# - Test progress saving
```

### What to Test

✅ **Wallet Connection**
- Can connect each supported wallet type
- Connection persists after page reload
- Disconnect works properly

✅ **Authentication**
- Signature verification succeeds
- JWT token is received
- User data is correct

✅ **Progress Tracking**
- Save progress works when logged in
- Load progress retrieves correct data
- Guest mode prevents saving

✅ **Account Switching**
- Switching accounts updates user
- Previous session is cleared
- New session starts fresh

## Troubleshooting

### "Wallet not found"
**Problem:** Browser extension not installed or not detected.

**Solution:**
- Install the wallet extension for your browser
- Refresh the page after installation
- Try WalletConnect for mobile wallets

### "Connection failed"
**Problem:** User rejected connection or wallet error.

**Solution:**
- Click "Connect Wallet" again
- Make sure you're on the correct network
- Check wallet is unlocked

### "Signature failed"
**Problem:** Message signing was rejected or failed.

**Solution:**
- Try connecting again
- Make sure you approve the signature request
- Check wallet has sufficient balance for gas (ETH)

### "Progress not saving"
**Problem:** Not authenticated or network error.

**Solution:**
- Verify you're logged in (check user badge)
- Check network connection
- Try logging out and back in

## Support

- 📖 Full documentation: [WALLET_SETUP_GUIDE.md](WALLET_SETUP_GUIDE.md)
- 🐛 Report issues: [GitHub Issues](https://github.com/Unwrenchable/9dttt/issues)
- 💬 Join Discord: [9DTTT Community](#)

---

**Happy Gaming! 🎮**
