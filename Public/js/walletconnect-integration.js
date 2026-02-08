/**
 * WalletConnect Integration
 * Provides broader wallet support beyond browser extensions
 * Supports mobile wallets and more wallet providers
 */

class WalletConnectIntegration {
    constructor() {
        this.provider = null;
        this.signClient = null;
        this.session = null;
        this.isInitialized = false;
    }

    /**
     * Initialize WalletConnect
     */
    async init() {
        if (this.isInitialized) return true;
        
        try {
            // WalletConnect will be loaded via CDN in HTML
            // Check if WalletConnect libraries are available
            if (typeof window.WalletConnectProvider === 'undefined') {
                console.warn('⚠️ WalletConnect not loaded - using direct wallet connections only');
                return false;
            }

            console.log('✅ WalletConnect integration ready');
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('WalletConnect init error:', error);
            return false;
        }
    }

    /**
     * Connect via WalletConnect (Ethereum)
     */
    async connectEthereum() {
        try {
            // Create WalletConnect Provider
            this.provider = new window.WalletConnectProvider.default({
                infuraId: "9aa3d95b3bc440fa88ea12eaa4456161", // Public Infura ID for demos
                rpc: {
                    1: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
                    5: "https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
                    11155111: "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
                },
                qrcode: true,
                chainId: 1 // Ethereum mainnet
            });

            // Enable session (triggers QR Code modal)
            await this.provider.enable();

            const accounts = this.provider.accounts;
            const chainId = this.provider.chainId;

            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts found');
            }

            return {
                success: true,
                wallet: 'WalletConnect',
                chain: 'ethereum',
                address: accounts[0],
                chainId: chainId,
                provider: this.provider
            };
        } catch (error) {
            throw new Error(`WalletConnect connection failed: ${error.message}`);
        }
    }

    /**
     * Sign message via WalletConnect
     */
    async signMessage(message, address) {
        if (!this.provider) {
            throw new Error('WalletConnect not connected');
        }

        try {
            // Convert message to hex
            const hexMessage = '0x' + Buffer.from(message, 'utf8').toString('hex');
            
            const signature = await this.provider.request({
                method: 'personal_sign',
                params: [hexMessage, address]
            });

            return signature;
        } catch (error) {
            throw new Error(`Signing failed: ${error.message}`);
        }
    }

    /**
     * Disconnect WalletConnect
     */
    async disconnect() {
        if (this.provider) {
            await this.provider.disconnect();
            this.provider = null;
            this.session = null;
        }
    }

    /**
     * Get connection status
     */
    isConnected() {
        return this.provider && this.provider.connected;
    }
}

// Export as global
if (typeof window !== 'undefined') {
    window.WalletConnectIntegration = WalletConnectIntegration;
    window.walletConnect = new WalletConnectIntegration();
    
    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.walletConnect.init();
        });
    } else {
        window.walletConnect.init();
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WalletConnectIntegration;
}
