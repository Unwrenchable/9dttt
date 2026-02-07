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
        if (!window.ethereum) {
            throw new Error('Ethereum wallet not found. Install MetaMask: https://metamask.io');
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

            return {
                success: true,
                wallet: this.connectedWallet,
                chain: this.chain,
                address: this.address,
                chainId: parseInt(chainId, 16)
            };
        } catch (error) {
            throw new Error(`Ethereum connection failed: ${error.message}`);
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
        
        this.connectedWallet = null;
        this.chain = null;
        this.address = null;
        
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
                    const signature = await window.ethereum.request({
                        method: 'personal_sign',
                        params: [message, this.address]
                    });
                    return { signature, address: this.address, chain: 'ethereum' };

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
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultiChainWallet;
}
