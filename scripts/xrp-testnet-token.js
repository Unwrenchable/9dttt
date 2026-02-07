/**
 * XRP Testnet Token Creator & Bridge Tester
 * AtomicFizz Ecosystem - atomicfizzcaps.xyz
 * 
 * This script:
 * 1. Creates test accounts on XRP Ledger Testnet
 * 2. Issues a custom token (e.g., FIZZ or GAME token)
 * 3. Sets up trust lines
 * 4. Tests token transfers
 * 5. Prepares for cross-chain bridge functionality
 */

const xrpl = require('xrpl');

// Configuration
const CONFIG = {
    testnetServer: 'wss://s.altnet.rippletest.net:51233',
    tokenCurrency: 'FIZZ', // Your token code (3 chars) or hex for longer names
    tokenValue: '77000000', // Total supply: 77 million (FIXED - all pre-minted)
    decimals: 6,
    treasuryModel: true, // Treasury holds all tokens, NO minting after launch
};

class XRPTestnetTokenManager {
    constructor() {
        this.client = null;
        this.issuerWallet = null;
        this.distributorWallet = null;
        this.userWallets = [];
    }

    /**
     * Connect to XRP Testnet
     */
    async connect() {
        console.log('🔗 Connecting to XRP Ledger Testnet...');
        this.client = new xrpl.Client(CONFIG.testnetServer);
        await this.client.connect();
        console.log('✅ Connected to Testnet:', CONFIG.testnetServer);
    }

    /**
     * Create and fund a new testnet wallet
     */
    async createAndFundWallet(label = 'Wallet') {
        console.log(`\n💰 Creating ${label}...`);
        const wallet = xrpl.Wallet.generate();
        
        // Fund wallet from testnet faucet
        console.log(`📡 Funding ${label} from faucet...`);
        const fundResult = await this.client.fundWallet(wallet);
        
        console.log(`✅ ${label} Created:`);
        console.log(`   Address: ${wallet.address}`);
        console.log(`   Seed: ${wallet.seed}`);
        console.log(`   Balance: ${fundResult.balance} XRP`);
        
        return wallet;
    }

    /**
     * Issue a custom token on XRP Ledger
     */
    async issueToken() {
        console.log('\n🪙 Creating Token Issuer Account...');
        this.issuerWallet = await this.createAndFundWallet('Token Issuer');
        
        console.log('\n🏦 Creating Token Distributor Account...');
        this.distributorWallet = await this.createAndFundWallet('Token Distributor');
        
        // Set up trust line from distributor to issuer
        console.log('\n🤝 Setting up Trust Line...');
        const trustSet = {
            TransactionType: 'TrustSet',
            Account: this.distributorWallet.address,
            LimitAmount: {
                currency: CONFIG.tokenCurrency,
                issuer: this.issuerWallet.address,
                value: CONFIG.tokenValue
            }
        };
        
        const trustPrepared = await this.client.autofill(trustSet);
        const trustSigned = this.distributorWallet.sign(trustPrepared);
        const trustResult = await this.client.submitAndWait(trustSigned.tx_blob);
        
        console.log('✅ Trust Line Established');
        console.log(`   Status: ${trustResult.result.meta.TransactionResult}`);
        
        // Send tokens from issuer to distributor
        console.log('\n💸 Issuing Tokens...');
        const payment = {
            TransactionType: 'Payment',
            Account: this.issuerWallet.address,
            Destination: this.distributorWallet.address,
            Amount: {
                currency: CONFIG.tokenCurrency,
                value: CONFIG.tokenValue,
                issuer: this.issuerWallet.address
            }
        };
        
        const paymentPrepared = await this.client.autofill(payment);
        const paymentSigned = this.issuerWallet.sign(paymentPrepared);
        const paymentResult = await this.client.submitAndWait(paymentSigned.tx_blob);
        
        console.log('✅ Tokens Issued Successfully!');
        console.log(`   Status: ${paymentResult.result.meta.TransactionResult}`);
        
        return {
            tokenCurrency: CONFIG.tokenCurrency,
            issuer: this.issuerWallet.address,
            distributor: this.distributorWallet.address,
            supply: CONFIG.tokenValue
        };
    }

    /**
     * Create test user wallets for bridge testing
     */
    async createTestUsers(count = 3) {
        console.log(`\n👥 Creating ${count} Test User Wallets...`);
        
        for (let i = 0; i < count; i++) {
            const userWallet = await this.createAndFundWallet(`User ${i + 1}`);
            
            // Set up trust line for this user
            console.log(`   Setting up trust line for User ${i + 1}...`);
            const trustSet = {
                TransactionType: 'TrustSet',
                Account: userWallet.address,
                LimitAmount: {
                    currency: CONFIG.tokenCurrency,
                    issuer: this.issuerWallet.address,
                    value: '10000'
                }
            };
            
            const trustPrepared = await this.client.autofill(trustSet);
            const trustSigned = userWallet.sign(trustPrepared);
            await this.client.submitAndWait(trustSigned.tx_blob);
            
            this.userWallets.push(userWallet);
        }
        
        console.log('✅ Test users created with trust lines');
    }

    /**
     * Test token transfer
     */
    async testTokenTransfer(fromWallet, toAddress, amount) {
        console.log(`\n🔄 Testing Token Transfer...`);
        console.log(`   From: ${fromWallet.address}`);
        console.log(`   To: ${toAddress}`);
        console.log(`   Amount: ${amount} ${CONFIG.tokenCurrency}`);
        
        const payment = {
            TransactionType: 'Payment',
            Account: fromWallet.address,
            Destination: toAddress,
            Amount: {
                currency: CONFIG.tokenCurrency,
                value: amount,
                issuer: this.issuerWallet.address
            }
        };
        
        const prepared = await this.client.autofill(payment);
        const signed = fromWallet.sign(prepared);
        const result = await this.client.submitAndWait(signed.tx_blob);
        
        console.log('✅ Transfer Complete');
        console.log(`   Status: ${result.result.meta.TransactionResult}`);
        console.log(`   TX Hash: ${result.result.hash}`);
        
        return result;
    }

    /**
     * Check token balance
     */
    async getTokenBalance(address) {
        const balances = await this.client.request({
            command: 'account_lines',
            account: address,
            ledger_index: 'validated'
        });
        
        const tokenBalance = balances.result.lines.find(
            line => line.currency === CONFIG.tokenCurrency && 
                    line.account === this.issuerWallet.address
        );
        
        return tokenBalance ? tokenBalance.balance : '0';
    }

    /**
     * Display all balances
     */
    async displayBalances() {
        console.log('\n📊 Token Balances:');
        console.log('─'.repeat(60));
        
        // Distributor
        const distBalance = await this.getTokenBalance(this.distributorWallet.address);
        console.log(`Distributor: ${distBalance} ${CONFIG.tokenCurrency}`);
        
        // Users
        for (let i = 0; i < this.userWallets.length; i++) {
            const userBalance = await this.getTokenBalance(this.userWallets[i].address);
            console.log(`User ${i + 1}: ${userBalance} ${CONFIG.tokenCurrency}`);
        }
        console.log('─'.repeat(60));
    }

    /**
     * Generate bridge configuration
     */
    generateBridgeConfig() {
        const config = {
            xrp: {
                network: 'testnet',
                server: CONFIG.testnetServer,
                tokenCurrency: CONFIG.tokenCurrency,
                tokenIssuer: this.issuerWallet.address,
                distributorAddress: this.distributorWallet.address,
                distributorSeed: this.distributorWallet.seed, // KEEP SECRET!
            },
            solana: {
                network: 'devnet',
                tokenMint: 'TO_BE_CREATED', // Create equivalent SPL token on Solana
                bridgeAuthority: 'TO_BE_GENERATED',
            },
            ethereum: {
                network: 'sepolia',
                tokenContract: 'TO_BE_DEPLOYED', // Deploy ERC20 equivalent
                bridgeContract: 'TO_BE_DEPLOYED',
            },
            bridge: {
                enabled: true,
                testMode: true,
                mechanism: 'lock-unlock', // Standard bridge: lock on source, unlock on target
                model: 'treasury', // Treasury-based distribution (NO minting)
                totalSupply: '77000000', // Fixed total - all pre-minted
                minTransfer: '1',
                maxTransfer: '10000',
                fee: '0.01', // 1% bridge fee
                description: 'Lock-Unlock Bridge: Treasury distributes tokens across chains'
            }
        };
        
        return config;
    }

    /**
     * Run complete setup
     */
    async setupComplete() {
        try {
            await this.connect();
            
            console.log('\n🚀 Starting XRP Testnet Token Setup...');
            console.log('═'.repeat(60));
            
            // Issue token
            const tokenInfo = await this.issueToken();
            
            // Create test users
            await this.createTestUsers(3);
            
            // Test some transfers
            console.log('\n🧪 Testing Token Transfers...');
            await this.testTokenTransfer(
                this.distributorWallet,
                this.userWallets[0].address,
                '100'
            );
            
            await this.testTokenTransfer(
                this.distributorWallet,
                this.userWallets[1].address,
                '50'
            );
            
            // Display balances
            await this.displayBalances();
            
            // Generate bridge config
            const bridgeConfig = this.generateBridgeConfig();
            
            console.log('\n✅ Setup Complete!');
            console.log('═'.repeat(60));
            console.log('\n📋 Token Information:');
            console.log(`   Currency: ${tokenInfo.tokenCurrency}`);
            console.log(`   Issuer: ${tokenInfo.issuer}`);
            console.log(`   Distributor: ${tokenInfo.distributor}`);
            console.log(`   Total Supply: ${tokenInfo.supply}`);
            
            console.log('\n🌉 Bridge Configuration Generated');
            console.log('   See: bridge-config.json');
            
            // Save configuration
            const fs = require('fs');
            fs.writeFileSync(
                'bridge-config.json',
                JSON.stringify(bridgeConfig, null, 2)
            );
            
            console.log('\n⚠️  IMPORTANT: Save these credentials securely!');
            console.log('   Issuer Seed:', this.issuerWallet.seed);
            console.log('   Distributor Seed:', this.distributorWallet.seed);
            
            console.log('\n🔗 Next Steps:');
            console.log('   1. Create equivalent tokens on Solana (SPL) and Ethereum (ERC20)');
            console.log('   2. Deploy bridge smart contracts');
            console.log('   3. Test cross-chain transfers');
            console.log('   4. Integrate with atomicfizzcaps.xyz');
            
        } catch (error) {
            console.error('❌ Error:', error);
            throw error;
        } finally {
            if (this.client && this.client.isConnected()) {
                await this.client.disconnect();
                console.log('\n🔌 Disconnected from Testnet');
            }
        }
    }
}

// Run if called directly
if (require.main === module) {
    const manager = new XRPTestnetTokenManager();
    manager.setupComplete()
        .then(() => {
            console.log('\n🎉 All done!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Failed:', error.message);
            process.exit(1);
        });
}

module.exports = XRPTestnetTokenManager;
