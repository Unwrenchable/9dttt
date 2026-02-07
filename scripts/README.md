# XRP Testnet Token & Bridge Testing Scripts

This directory contains scripts for setting up and testing the AtomicFizz cross-chain ecosystem on testnets.

## 🚀 Quick Start

### 1. Create XRP Testnet Token

```bash
cd /home/runner/work/9dttt/9dttt
node scripts/xrp-testnet-token.js
```

This will:
- ✅ Create token issuer and distributor accounts on XRP Testnet
- ✅ Fund accounts from the testnet faucet
- ✅ Issue 1,000,000 FIZZ tokens
- ✅ Create 3 test user accounts with trust lines
- ✅ Test token transfers
- ✅ Generate `bridge-config.json` with all credentials

### 2. Save Your Credentials

**IMPORTANT**: The script outputs sensitive wallet seeds. Save them securely:

```
Issuer Seed: s████████████████████████████
Distributor Seed: s████████████████████████████
```

Store these in a `.env` file or secure vault - you'll need them for the bridge!

### 3. View Configuration

After running, check `bridge-config.json`:

```json
{
  "xrp": {
    "network": "testnet",
    "server": "wss://s.altnet.rippletest.net:51233",
    "tokenCurrency": "FIZZ",
    "tokenIssuer": "r████████████████████████████",
    "distributorAddress": "r████████████████████████████"
  },
  "solana": {
    "network": "devnet",
    "tokenMint": "TO_BE_CREATED"
  },
  "ethereum": {
    "network": "sepolia",
    "tokenContract": "TO_BE_DEPLOYED"
  },
  "bridge": {
    "enabled": true,
    "testMode": true,
    "minTransfer": "1",
    "maxTransfer": "10000",
    "fee": "0.01"
  }
}
```

## 🌉 Cross-Chain Bridge Testing

### Overview

The bridge enables asset transfers between:
- **XRP Ledger** ↔ **Solana** ↔ **Ethereum**

### Architecture

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   XRP LEDGER │◄────►│    BRIDGE    │◄────►│    SOLANA    │
│   (Testnet)  │      │   RELAYER    │      │   (Devnet)   │
└──────────────┘      └──────────────┘      └──────────────┘
       ▲                      ▲                      ▲
       │                      │                      │
       └──────────────────────┼──────────────────────┘
                              │
                     ┌────────▼────────┐
                     │    ETHEREUM     │
                     │    (Sepolia)    │
                     └─────────────────┘
```

### Next Steps

1. **Create Solana SPL Token**
   ```bash
   # Coming soon: scripts/solana-testnet-token.js
   ```

2. **Deploy Ethereum ERC20 Token**
   ```bash
   # Coming soon: scripts/ethereum-testnet-token.js
   ```

3. **Deploy Bridge Contracts**
   ```bash
   # Coming soon: scripts/deploy-bridge.js
   ```

4. **Test Cross-Chain Transfer**
   ```bash
   # Coming soon: scripts/test-bridge-transfer.js
   ```

## 📊 Verification

### Check XRP Token on Testnet

1. Go to [XRP Testnet Explorer](https://testnet.xrpl.org/)
2. Enter your issuer address
3. View token details and transactions

### Check Balance

```bash
node scripts/check-balance.js <ADDRESS>
```

## 🎮 Integration with Games

Once the bridge is working, games can:

1. **Reward players with FIZZ tokens on XRP**
2. **Players can bridge to Solana for DeFi**
3. **Bridge to Ethereum for NFT minting**
4. **Use tokens across all 3 chains**

### Game Integration Example

```javascript
// In your game JavaScript
async function rewardPlayer(score) {
    if (window.multiChainWallet && window.multiChainWallet.address) {
        // Award tokens based on score
        const tokenAmount = Math.floor(score / 100);
        
        await fetch('/api/reward-tokens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerAddress: window.multiChainWallet.address,
                amount: tokenAmount,
                currency: 'FIZZ',
                chain: window.multiChainWallet.chain
            })
        });
    }
}
```

## 🔐 Security Notes

⚠️ **TESTNET ONLY** - These scripts are for testing purposes only!

- Never use testnet seeds on mainnet
- Never commit seeds to version control
- Use environment variables for production
- Implement proper key management
- Add rate limiting and validation

## 📖 Additional Resources

- [XRP Ledger Documentation](https://xrpl.org/docs.html)
- [XRPL.js SDK](https://js.xrpl.org/)
- [XRP Testnet Faucet](https://xrpl.org/xrp-testnet-faucet.html)
- [Solana Documentation](https://docs.solana.com/)
- [Ethereum Documentation](https://ethereum.org/en/developers/docs/)

## 🐛 Troubleshooting

### "Cannot connect to testnet"
- Check your internet connection
- Try alternative testnet server: `wss://s.devnet.rippletest.net:51233`

### "Faucet failed"
- Testnet faucets have rate limits
- Wait a few minutes and try again
- Try alternative faucet at xrpl.org

### "Transaction failed"
- Check account has sufficient XRP for fees
- Verify trust line is established
- Check token issuer address is correct

## 💡 Tips

1. **Use descriptive token names**: FIZZ, GAME, ATOM, etc.
2. **Document all addresses**: Keep a spreadsheet of test accounts
3. **Test incrementally**: Start with small transfers
4. **Monitor testnet explorer**: Watch transactions in real-time
5. **Save all output**: Keep logs of test runs

---

## 🚀 AtomicFizz Ecosystem

Part of the **atomicfizzcaps.xyz** cross-chain gaming platform.

**Mission**: Enable seamless asset portability across blockchains for gaming.
