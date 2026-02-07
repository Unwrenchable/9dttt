# 🚀 QUICK START: Launch Your Testnet Token

## Ready to Go? Follow These Steps!

### Option 1: Automated Script (Recommended)

```bash
# Navigate to project
cd /home/runner/work/9dttt/9dttt

# Run the XRP testnet token creator
npm run setup:xrp-testnet

# Or directly:
node scripts/xrp-testnet-token.js
```

**What it does:**
- ✅ Creates 2 new XRP testnet wallets (issuer & distributor)
- ✅ Funds them from testnet faucet (1000 XRP each)
- ✅ Issues 10,000,000 FIZZ tokens
- ✅ Creates 3 test user accounts
- ✅ Sets up trust lines
- ✅ Tests token transfers
- ✅ Generates `bridge-config.json`

**Output:**
```
✅ Setup Complete!
═══════════════════════════════════════

📋 Token Information:
   Currency: FIZZ
   Issuer: rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   Distributor: rYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
   Total Supply: 1000000

⚠️  IMPORTANT: Save these credentials securely!
   Issuer Seed: sXXXXXXXXXXXXXXXXXXXXXXXX
   Distributor Seed: sYYYYYYYYYYYYYYYYYYYYYY
```

### Option 2: Manual XUMM Setup (If Script Fails)

**Step 1: Install XUMM**
- Download: https://xumm.app/
- Enable Testnet mode in Settings

**Step 2: Get Testnet XRP**
- Visit: https://xrpl.org/xrp-testnet-faucet.html
- Paste your XUMM testnet address
- Receive 1000 XRP

**Step 3: Issue Token via XUMM**
1. Open XUMM app
2. Go to "Tokens" section
3. Click "Issue Token"
4. Enter:
   - Currency Code: `FIZZ`
   - Amount: `1000000`
5. Sign and submit

**Step 4: Save Configuration**
Create `bridge-config.json`:
```json
{
  "xrp": {
    "network": "testnet",
    "tokenCurrency": "FIZZ",
    "tokenIssuer": "YOUR_ADDRESS_HERE",
    "distributorAddress": "YOUR_ADDRESS_HERE"
  }
}
```

## 📊 Verify Your Token

### Check on XRP Explorer
1. Go to: https://testnet.xrpl.org/
2. Enter your issuer address
3. Click "Tokens" tab
4. See your FIZZ token!

### Check Balance via Script
```bash
# Coming soon
node scripts/check-balance.js <YOUR_ADDRESS>
```

## 🎮 Test in Games

### Enable Token Rewards

1. **Update your wallet in Crypto Quest**
   - Open: http://localhost:3000/games/crypto-quest.html
   - Click wallet icon
   - Connect XUMM or Crossmark
   - Your XRP testnet address should show

2. **Play and Earn**
   - Play the game
   - Earn points
   - Receive FIZZ tokens automatically!

3. **Check Your Tokens**
   - Open XUMM app
   - Go to "Tokens"
   - See your FIZZ balance

## 🌉 Next: Set Up Bridge

### Phase 2: Solana Token

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Set to devnet
solana config set --url https://api.devnet.solana.com

# Get test SOL
solana airdrop 2

# Create SPL token
spl-token create-token --decimals 6

# Mint tokens
spl-token create-account <TOKEN_ADDRESS>
spl-token mint <TOKEN_ADDRESS> 1000000
```

### Phase 3: Ethereum Token

```bash
# Get Sepolia ETH
# Visit: https://sepoliafaucet.com/

# Deploy ERC20 (using Remix or Hardhat)
# Use the FizzToken.sol contract from TESTNET_BRIDGE_SETUP.md
```

## 📞 Need Help?

### Troubleshooting

**"Cannot connect to testnet"**
- Check internet connection
- Try alternative server: `wss://s.devnet.rippletest.net:51233`

**"Faucet failed"**
- Wait 5 minutes and try again
- Testnet faucets have rate limits

**"Transaction failed"**
- Ensure sufficient XRP for fees (need 20+ XRP reserve)
- Check trust line is established

### Resources

- 📖 Full Guide: `TESTNET_BRIDGE_SETUP.md`
- 📖 Script Docs: `scripts/README.md`
- 🌐 XRP Docs: https://xrpl.org/docs.html
- 💬 Support: Create GitHub issue

## ✅ Checklist

- [ ] Run `npm run setup:xrp-testnet`
- [ ] Save wallet seeds securely
- [ ] Verify token on XRP explorer
- [ ] Test in Crypto Quest game
- [ ] Set up Solana token (Phase 2)
- [ ] Deploy Ethereum token (Phase 3)
- [ ] Test cross-chain bridge
- [ ] Integrate with atomicfizzcaps.xyz

## 🎉 Success!

Once complete, you'll have:
- ✅ Working testnet token on XRP
- ✅ Token rewards in games
- ✅ Foundation for cross-chain bridge
- ✅ Ready for Solana and Ethereum integration

**Let's build the future of cross-chain gaming!** 🚀

---

AtomicFizz Ecosystem - atomicfizzcaps.xyz
