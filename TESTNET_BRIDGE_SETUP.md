# AtomicFizz Cross-Chain Bridge - Testnet Setup Guide

## 🎯 Objective

Set up a complete cross-chain bridge between XRP Ledger, Solana, and Ethereum testnets for the 9DTTT gaming platform and atomicfizzcaps.xyz ecosystem.

## 📋 Prerequisites

### Required Tools
- Node.js 18+ 
- XRP Ledger access (XUMM wallet for testnet)
- Solana CLI tools
- Ethereum wallet (MetaMask with Sepolia testnet)

### Required Dependencies (Already Installed)
```json
{
  "xrpl": "^4.3.1",
  "@solana/web3.js": "^1.95.7",
  "ethers": "^6.13.4"
}
```

## 🚀 Step-by-Step Setup

### Phase 1: XRP Testnet Token (FIZZ)

#### Option A: Using the Script (Requires Network Access)

```bash
# Run automated setup
npm run setup:xrp-testnet

# Or manually
node scripts/xrp-testnet-token.js
```

#### Option B: Manual Setup via XUMM Testnet

1. **Install XUMM App** (Mobile or Desktop)
   - Download from https://xumm.app/
   - Switch to Testnet mode in settings

2. **Get Testnet XRP**
   - Visit: https://xrpl.org/xrp-testnet-faucet.html
   - Enter your XUMM testnet address
   - Receive 1,000 XRP for testing

3. **Issue FIZZ Token**
   ```javascript
   // Token Details
   Currency Code: FIZZ
   Initial Supply: 1,000,000
   Decimals: 6
   ```

4. **Save Configuration**
   ```json
   {
     "issuer": "rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
     "distributor": "rYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY",
     "currency": "FIZZ",
     "network": "testnet"
   }
   ```

### Phase 2: Solana Devnet Token (SPL)

```bash
# Coming in next update
npm run setup:solana-testnet
```

**Manual Steps:**

1. **Install Solana CLI**
   ```bash
   sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
   ```

2. **Create Devnet Wallet**
   ```bash
   solana-keygen new --outfile ~/.config/solana/devnet.json
   solana config set --url https://api.devnet.solana.com
   ```

3. **Get Devnet SOL**
   ```bash
   solana airdrop 2
   ```

4. **Create SPL Token**
   ```bash
   spl-token create-token --decimals 6
   # Save the token address
   
   spl-token create-account <TOKEN_ADDRESS>
   spl-token mint <TOKEN_ADDRESS> 1000000
   ```

### Phase 3: Ethereum Sepolia Token (ERC20)

```bash
# Coming in next update
npm run setup:ethereum-testnet
```

**Manual Steps:**

1. **Get Sepolia ETH**
   - Visit: https://sepoliafaucet.com/
   - Or: https://faucet.sepolia.dev/

2. **Deploy ERC20 Contract**
   ```solidity
   // contracts/FizzToken.sol
   pragma solidity ^0.8.0;
   
   import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
   
   contract FizzToken is ERC20 {
       constructor() ERC20("Fizz Token", "FIZZ") {
           _mint(msg.sender, 1000000 * 10 ** decimals());
       }
   }
   ```

3. **Deploy via Remix or Hardhat**
   ```bash
   npx hardhat run scripts/deploy-fizz.js --network sepolia
   ```

## 🌉 Bridge Architecture

### Configuration File: `bridge-config.json`

```json
{
  "version": "1.0.0",
  "testMode": true,
  "chains": {
    "xrp": {
      "network": "testnet",
      "server": "wss://s.altnet.rippletest.net:51233",
      "tokenCurrency": "FIZZ",
      "tokenIssuer": "rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      "distributorAddress": "rYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY",
      "explorer": "https://testnet.xrpl.org"
    },
    "solana": {
      "network": "devnet",
      "endpoint": "https://api.devnet.solana.com",
      "tokenMint": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      "programId": "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
      "explorer": "https://explorer.solana.com/?cluster=devnet"
    },
    "ethereum": {
      "network": "sepolia",
      "rpcUrl": "https://sepolia.infura.io/v3/YOUR_KEY",
      "tokenContract": "0x1234567890123456789012345678901234567890",
      "bridgeContract": "0x0987654321098765432109876543210987654321",
      "explorer": "https://sepolia.etherscan.io"
    }
  },
  "bridge": {
    "enabled": true,
    "testMode": true,
    "minTransfer": "1",
    "maxTransfer": "10000",
    "feePercent": "1.0",
    "confirmations": {
      "xrp": 1,
      "solana": 32,
      "ethereum": 12
    }
  },
  "relayer": {
    "apiEndpoint": "https://atomicfizzcaps.xyz/api/bridge",
    "websocket": "wss://atomicfizzcaps.xyz/bridge",
    "checkInterval": 5000
  }
}
```

## 🔄 Bridge Transfer Flow

### XRP → Solana Transfer

```
1. User locks FIZZ tokens on XRP (sends to bridge address)
2. XRP relayer detects lock transaction
3. Relayer signs mint transaction on Solana
4. User receives equivalent FIZZ SPL tokens on Solana
```

### Implementation

```javascript
// Example: Bridge transfer from XRP to Solana
async function bridgeTransfer(from, to, amount, targetChain) {
    // 1. Lock tokens on source chain
    const lockTx = await lockTokens(from, amount);
    
    // 2. Wait for confirmation
    await waitForConfirmation(lockTx);
    
    // 3. Relayer mints on target chain
    const mintTx = await relayerMint(to, amount, targetChain);
    
    // 4. Return transfer proof
    return {
        sourceTx: lockTx,
        targetTx: mintTx,
        status: 'completed'
    };
}
```

## 🎮 Game Integration

### Reward Players with Tokens

```javascript
// In your game code (e.g., crypto-quest.js)
class CryptoQuestGame {
    async rewardPlayer(score) {
        const tokenReward = Math.floor(score / 100); // 1 FIZZ per 100 points
        
        if (window.multiChainWallet && window.multiChainWallet.address) {
            try {
                const result = await fetch('/api/game-rewards', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                    },
                    body: JSON.stringify({
                        gameId: 'crypto-quest',
                        playerAddress: window.multiChainWallet.address,
                        chain: window.multiChainWallet.chain,
                        amount: tokenReward,
                        score: score
                    })
                });
                
                const data = await result.json();
                console.log('Token reward sent:', data);
                
                // Show success message to player
                this.showNotification(`🎉 You earned ${tokenReward} FIZZ tokens!`);
            } catch (error) {
                console.error('Reward failed:', error);
            }
        }
    }
}
```

### Bridge UI Component

```javascript
// Add to game UI
function showBridgeUI() {
    const bridgeModal = `
        <div class="bridge-modal">
            <h2>🌉 Cross-Chain Bridge</h2>
            <p>Transfer your FIZZ tokens between chains</p>
            
            <select id="sourceChain">
                <option value="xrp">XRP Ledger</option>
                <option value="solana">Solana</option>
                <option value="ethereum">Ethereum</option>
            </select>
            
            <input type="number" id="bridgeAmount" placeholder="Amount to bridge">
            
            <select id="targetChain">
                <option value="solana">Solana</option>
                <option value="xrp">XRP Ledger</option>
                <option value="ethereum">Ethereum</option>
            </select>
            
            <button onclick="executeBridge()">Bridge Tokens</button>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', bridgeModal);
}
```

## 📊 Testing Checklist

### XRP Testnet
- [ ] Create issuer account
- [ ] Create distributor account
- [ ] Issue FIZZ tokens
- [ ] Create user trust lines
- [ ] Test token transfers
- [ ] Verify on XRP explorer

### Solana Devnet
- [ ] Create SPL token
- [ ] Mint initial supply
- [ ] Create token accounts
- [ ] Test transfers
- [ ] Verify on Solana explorer

### Ethereum Sepolia
- [ ] Deploy ERC20 contract
- [ ] Mint initial supply
- [ ] Test transfers
- [ ] Verify on Etherscan

### Bridge Testing
- [ ] Lock tokens on source chain
- [ ] Verify relayer detection
- [ ] Confirm mint on target chain
- [ ] Test reverse bridge
- [ ] Verify fee calculation
- [ ] Test edge cases (min/max amounts)

## 🔒 Security Considerations

### Key Management
```bash
# NEVER commit these to git!
# Store in .env or secure vault

XRP_ISSUER_SEED=sXXXXXXXXXXXXXXXXXXXXXXXXXX
XRP_DISTRIBUTOR_SEED=sYYYYYYYYYYYYYYYYYYYYYYYYY
SOLANA_KEYPAIR_PATH=/secure/path/to/keypair.json
ETHEREUM_PRIVATE_KEY=0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ
```

### Add to `.gitignore`
```
bridge-config.json
*.keypair
*.seed
.env.bridge
testnet-credentials.json
```

### Rate Limiting
```javascript
// Implement on relayer
const rateLimit = {
    perUser: '10 transfers per hour',
    perChain: '1000 transfers per hour',
    minAmount: '1 FIZZ',
    maxAmount: '10000 FIZZ'
};
```

## 📚 Next Steps

1. **Run XRP Testnet Setup**
   ```bash
   node scripts/xrp-testnet-token.js
   ```

2. **Create Solana Devnet Token**
   ```bash
   # Coming soon
   node scripts/solana-testnet-token.js
   ```

3. **Deploy Ethereum Contract**
   ```bash
   # Coming soon
   node scripts/ethereum-testnet-token.js
   ```

4. **Start Bridge Relayer**
   ```bash
   # Coming soon
   node scripts/start-bridge-relayer.js
   ```

5. **Test Complete Flow**
   ```bash
   # Coming soon
   node scripts/test-bridge-transfer.js
   ```

## 🆘 Support

- **Documentation**: See `/scripts/README.md`
- **Issues**: Create GitHub issue with `[bridge]` tag
- **Community**: Join Discord (link in main README)

## 🎉 Success Metrics

Once complete, you'll be able to:
- ✅ Issue tokens on 3 different testnets
- ✅ Transfer tokens between chains
- ✅ Reward game players with real testnet tokens
- ✅ Test cross-chain gaming ecosystem
- ✅ Prepare for mainnet launch

---

**AtomicFizz Ecosystem** - atomicfizzcaps.xyz
*Building the future of cross-chain gaming* 🚀
