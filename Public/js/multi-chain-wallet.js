/**
 * Multi-Chain Wallet Integration
 * Supports: Ethereum (MetaMask), Solana (Phantom), XRP (XUMM/Crossmark)
 * Part of AtomicFizz Ecosystem - atomicfizzcaps.xyz
 */

class MultiChainWallet {
    constructor() {
        this.connectedWallet = null;
        this.chain = null;
        this.address = null;
        this.walletConnectProvider = null;
        this.isInitialized = false;
        this.initPromise = null;
    }

    /**
     * Initialize wallet system - load saved connections
     */
    async init() {
        if (this.initPromise) return this.initPromise;
        
        this.initPromise = (async () => {
            try {
                console.log('🔌 Initializing multi-chain wallet...');
                
                // Try to restore previous connection
                const savedChain = localStorage.getItem('wallet_chain');
                const savedAddress = localStorage.getItem('wallet_address');
                const savedWallet = localStorage.getItem('wallet_type');
                
                if (savedChain && savedAddress && savedWallet) {
                    console.log(`🔄 Restoring ${savedChain} wallet connection...`);
                    this.chain = savedChain;
                    this.address = savedAddress;
                    this.connectedWallet = savedWallet;
                    
                    // Verify connection is still active
                    const isStillConnected = await this.verifyConnection();
                    if (!isStillConnected) {
                        console.warn('⚠️ Previous wallet connection lost');
                        this.clearConnectionState();
                    } else {
                        console.log('✅ Wallet connection restored');
                    }
                }
                
                this.isInitialized = true;
                return true;
            } catch (error) {
                console.error('⚠️ Wallet initialization error:', error.message);
                this.isInitialized = true;
                return false;
            }
        })();
        
        return this.initPromise;
    }

    /**
     * Verify if wallet is still connected
     */
    async verifyConnection() {
        if (!this.address || !this.chain) return false;
        
        try {
            switch (this.chain) {
                case 'ethereum':
                    if (!window.ethereum) return false;
                    const accounts = await window.ethereum.request({ 
                        method: 'eth_accounts' 
                    });
                    return accounts.includes(this.address);
                    
                case 'solana':
                    if (!window.solana || !window.solana.isConnected) return false;
                    return window.solana.publicKey?.toString() === this.address;
                    
                case 'xrp':
                    // XRP wallets require manual reconnection
                    return false;
                    
                default:
                    return false;
            }
        } catch (error) {
            return false;
        }
    }

    /**
     * Clear connection state
     */
    clearConnectionState() {
        this.connectedWallet = null;
        this.chain = null;
        this.address = null;
        localStorage.removeItem('wallet_chain');
        localStorage.removeItem('wallet_address');
        localStorage.removeItem('wallet_type');
    }

    /**
     * Save connection state
     */
    saveConnectionState() {
        if (this.chain && this.address && this.connectedWallet) {
            localStorage.setItem('wallet_chain', this.chain);
            localStorage.setItem('wallet_address', this.address);
            localStorage.setItem('wallet_type', this.connectedWallet);
        }
    }

    /**
     * Detect available wallets
     */
    detectWallets() {
        const wallets = {
            ethereum: !!window.ethereum,
            solana: !!(window.solana && window.solana.isPhantom),
            xumm: !!window.xumm,
            crossmark: !!window.crossmark
        };
        
        return wallets;
    }

    /**
     * Connect to Ethereum (MetaMask, etc.)
     */
    async connectEthereum() {
        // Try MetaMask first, fallback to WalletConnect
        if (window.ethereum) {
            return this.connectMetaMask();
        } else if (window.walletConnect && window.walletConnect.isInitialized) {
            return this.connectViaWalletConnect();
        } else {
            throw new Error('No Ethereum wallet found. Install MetaMask or use WalletConnect');
        }
    }

    /**
     * Connect via MetaMask
     */
    async connectMetaMask() {
        if (!window.ethereum) {
            throw new Error('MetaMask not found. Install MetaMask: https://metamask.io');
        }

        try {
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            this.connectedWallet = 'MetaMask';
            this.chain = 'ethereum';
            this.address = accounts[0];

            // Get chain ID
            const chainId = await window.ethereum.request({ 
                method: 'eth_chainId' 
            });

            // Save connection state
            this.saveConnectionState();

            // Listen for account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.clearConnectionState();
                } else if (accounts[0] !== this.address) {
                    this.address = accounts[0];
                    this.saveConnectionState();
                }
            });

            return {
                success: true,
                wallet: this.connectedWallet,
                chain: this.chain,
                address: this.address,
                chainId: parseInt(chainId, 16)
            };
        } catch (error) {
            throw new Error(`MetaMask connection failed: ${error.message}`);
        }
    }

    /**
     * Connect via WalletConnect
     */
    async connectViaWalletConnect() {
        if (!window.walletConnect) {
            throw new Error('WalletConnect not initialized');
        }

        try {
            const result = await window.walletConnect.connectEthereum();
            
            this.connectedWallet = 'WalletConnect';
            this.chain = 'ethereum';
            this.address = result.address;
            this.walletConnectProvider = result.provider;

            // Save connection state
            this.saveConnectionState();

            return {
                success: true,
                wallet: this.connectedWallet,
                chain: this.chain,
                address: this.address,
                chainId: result.chainId
            };
        } catch (error) {
            throw new Error(`WalletConnect connection failed: ${error.message}`);
        }
    }

    /**
     * Connect to Solana (Phantom)
     */
    async connectSolana() {
        if (!window.solana || !window.solana.isPhantom) {
            throw new Error('Phantom wallet not found. Install Phantom: https://phantom.app');
        }

        try {
            const resp = await window.solana.connect();
            const publicKey = resp.publicKey.toString();
            
            this.connectedWallet = 'Phantom';
            this.chain = 'solana';
            this.address = publicKey;

            // Save connection state
            this.saveConnectionState();

            // Listen for disconnection
            window.solana.on('disconnect', () => {
                this.clearConnectionState();
            });

            return {
                success: true,
                wallet: this.connectedWallet,
                chain: this.chain,
                address: this.address
            };
        } catch (error) {
            throw new Error(`Solana connection failed: ${error.message}`);
        }
    }

    /**
     * Connect to XRP Ledger via XUMM
     */
    async connectXUMM() {
        if (!window.xumm) {
            // Redirect to XUMM PWA or show install instructions
            const installXUMM = confirm(
                'XUMM wallet not detected.\n\n' +
                'XUMM is required for XRP Ledger integration.\n\n' +
                'Click OK to install XUMM, or Cancel to try another wallet.'
            );
            
            if (installXUMM) {
                window.open('https://xumm.app/', '_blank');
            }
            throw new Error('XUMM wallet not found');
        }

        try {
            // XUMM SDK integration
            const result = await window.xumm.authorize();
            
            if (!result || !result.account) {
                throw new Error('XUMM authorization failed');
            }

            this.connectedWallet = 'XUMM';
            this.chain = 'xrp';
            this.address = result.account;

            // Save connection state
            this.saveConnectionState();

            return {
                success: true,
                wallet: this.connectedWallet,
                chain: this.chain,
                address: this.address,
                networkEndpoint: result.networkEndpoint || 'wss://xrplcluster.com'
            };
        } catch (error) {
            throw new Error(`XUMM connection failed: ${error.message}`);
        }
    }

    /**
     * Connect to XRP Ledger via Crossmark
     */
    async connectCrossmark() {
        if (!window.crossmark || !window.crossmark.xrpl) {
            throw new Error('Crossmark wallet not found. Install Crossmark: https://crossmark.io');
        }

        try {
            const result = await window.crossmark.xrpl.signIn();
            
            if (!result || !result.response || !result.response.data) {
                throw new Error('Crossmark sign-in failed');
            }

            const { address } = result.response.data;
            
            this.connectedWallet = 'Crossmark';
            this.chain = 'xrp';
            this.address = address;

            // Save connection state
            this.saveConnectionState();

            return {
                success: true,
                wallet: this.connectedWallet,
                chain: this.chain,
                address: this.address
            };
        } catch (error) {
            throw new Error(`Crossmark connection failed: ${error.message}`);
        }
    }

    /**
     * Auto-detect and connect to best available wallet
     */
    async autoConnect() {
        const wallets = this.detectWallets();
        
        // Priority: XUMM (for XRP) > Phantom (for Solana) > MetaMask (for EVM)
        if (wallets.xumm) {
            try {
                return await this.connectXUMM();
            } catch (error) {
                console.warn('XUMM connection failed, trying next wallet...');
            }
        }
        
        if (wallets.crossmark) {
            try {
                return await this.connectCrossmark();
            } catch (error) {
                console.warn('Crossmark connection failed, trying next wallet...');
            }
        }
        
        if (wallets.solana) {
            try {
                return await this.connectSolana();
            } catch (error) {
                console.warn('Solana connection failed, trying next wallet...');
            }
        }
        
        if (wallets.ethereum) {
            try {
                return await this.connectEthereum();
            } catch (error) {
                console.warn('Ethereum connection failed');
            }
        }
        
        throw new Error('No compatible wallet found');
    }

    /**
     * Disconnect current wallet
     */
    async disconnect() {
        if (this.chain === 'solana' && window.solana) {
            await window.solana.disconnect();
        }
        
        this.clearConnectionState();
        
        return { success: true };
    }

    /**
     * Get wallet balance
     */
    async getBalance() {
        if (!this.address) {
            throw new Error('No wallet connected');
        }

        try {
            switch (this.chain) {
                case 'ethereum':
                    const balance = await window.ethereum.request({
                        method: 'eth_getBalance',
                        params: [this.address, 'latest']
                    });
                    return {
                        balance: parseInt(balance, 16) / 1e18,
                        currency: 'ETH',
                        chain: 'ethereum'
                    };

                case 'solana':
                    const connection = new window.solanaWeb3.Connection(
                        'https://api.mainnet-beta.solana.com'
                    );
                    const solBalance = await connection.getBalance(
                        new window.solanaWeb3.PublicKey(this.address)
                    );
                    return {
                        balance: solBalance / 1e9,
                        currency: 'SOL',
                        chain: 'solana'
                    };

                case 'xrp':
                    // XRP balance check
                    const response = await fetch(`https://api.xrpscan.com/api/v1/account/${this.address}`);
                    const data = await response.json();
                    return {
                        balance: parseFloat(data.xrpBalance) || 0,
                        currency: 'XRP',
                        chain: 'xrp'
                    };

                default:
                    throw new Error('Unsupported chain');
            }
        } catch (error) {
            console.error('Balance fetch error:', error);
            return {
                balance: 0,
                currency: 'Unknown',
                chain: this.chain,
                error: error.message
            };
        }
    }

    /**
     * Sign a message (for authentication)
     */
    async signMessage(message) {
        if (!this.address) {
            throw new Error('No wallet connected');
        }

        try {
            switch (this.chain) {
                case 'ethereum':
                    // Use WalletConnect provider if connected via WalletConnect
                    if (this.connectedWallet === 'WalletConnect' && this.walletConnectProvider) {
                        const signature = await window.walletConnect.signMessage(message, this.address);
                        return { signature, address: this.address, chain: 'ethereum' };
                    }
                    // Otherwise use MetaMask
                    else if (window.ethereum) {
                        const signature = await window.ethereum.request({
                            method: 'personal_sign',
                            params: [message, this.address]
                        });
                        return { signature, address: this.address, chain: 'ethereum' };
                    }
                    throw new Error('No Ethereum provider available');

                case 'solana':
                    const encodedMessage = new TextEncoder().encode(message);
                    const signedMessage = await window.solana.signMessage(encodedMessage, 'utf8');
                    return { 
                        signature: signedMessage.signature, 
                        address: this.address, 
                        chain: 'solana' 
                    };

                case 'xrp':
                    // XRP message signing via XUMM or Crossmark
                    if (this.connectedWallet === 'XUMM' && window.xumm) {
                        const payload = await window.xumm.payload.create({
                            txjson: {
                                TransactionType: 'SignIn'
                            }
                        });
                        return { 
                            signature: payload.uuid, 
                            address: this.address, 
                            chain: 'xrp',
                            wallet: 'XUMM'
                        };
                    } else if (this.connectedWallet === 'Crossmark' && window.crossmark) {
                        const result = await window.crossmark.xrpl.sign({
                            message: message
                        });
                        return { 
                            signature: result.response.data.signature, 
                            address: this.address, 
                            chain: 'xrp',
                            wallet: 'Crossmark'
                        };
                    }
                    throw new Error('XRP signing not available');

                default:
                    throw new Error('Unsupported chain for signing');
            }
        } catch (error) {
            throw new Error(`Message signing failed: ${error.message}`);
        }
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            connected: !!this.address,
            wallet: this.connectedWallet,
            chain: this.chain,
            address: this.address
        };
    }
}

// Export as global
if (typeof window !== 'undefined') {
    window.MultiChainWallet = MultiChainWallet;
    window.multiChainWallet = new MultiChainWallet();
    
    // Auto-initialize wallet on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.multiChainWallet.init().catch(err => {
                console.error('Wallet init failed:', err);
            });
        });
    } else {
        window.multiChainWallet.init().catch(err => {
            console.error('Wallet init failed:', err);
        });
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultiChainWallet;
}
