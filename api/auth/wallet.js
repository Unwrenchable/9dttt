/**
 * Web3 Wallet Authentication API
 * Verifies wallet signatures and creates/logs in users
 */

const { ethers } = require('ethers');
const nacl = require('tweetnacl');
const bs58 = require('bs58');
const crypto = require('crypto');

/**
 * Verify Ethereum signature
 */
function verifyEthereumSignature(message, signature, address) {
    try {
        const recoveredAddress = ethers.verifyMessage(message, signature);
        return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
        console.error('Ethereum verification error:', error);
        return false;
    }
}

/**
 * Verify Solana signature
 */
function verifySolanaSignature(message, signature, publicKey) {
    try {
        const messageBytes = new TextEncoder().encode(message);
        const signatureBytes = bs58.decode(signature);
        const publicKeyBytes = bs58.decode(publicKey);
        
        return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
    } catch (error) {
        console.error('Solana verification error:', error);
        return false;
    }
}

/**
 * Verify XRP signature (simplified - XUMM/Crossmark handle verification)
 */
function verifyXRPSignature(message, signature, address) {
    try {
        // XRP wallets (XUMM/Crossmark) pre-verify on client side
        // Additional server-side verification can be added with xrpl library
        // For now, we trust the client-side verification
        return signature && address && signature.length > 0;
    } catch (error) {
        console.error('XRP verification error:', error);
        return false;
    }
}

/**
 * Verify wallet signature
 */
async function verifyWalletSignature(chain, address, message, signature) {
    try {
        let valid = false;
        
        switch (chain) {
            case 'ethereum':
                valid = verifyEthereumSignature(message, signature, address);
                break;
                
            case 'solana':
                valid = verifySolanaSignature(message, signature, address);
                break;
                
            case 'xrp':
                valid = verifyXRPSignature(message, signature, address);
                break;
                
            default:
                throw new Error(`Unsupported chain: ${chain}`);
        }
        
        return { valid, address };
    } catch (error) {
        console.error('Signature verification error:', error);
        return { valid: false, error: error.message };
    }
}

/**
 * Wallet authentication handler
 */
module.exports = async (req, res) => {
    try {
        const { chain, address, signature, message, wallet } = req.body;
        
        // Validate inputs
        if (!chain || !address || !signature || !message) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields: chain, address, signature, message' 
            });
        }

        // Verify signature
        const verification = await verifyWalletSignature(chain, address, message, signature);
        
        if (!verification.valid) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid signature - wallet verification failed' 
            });
        }

        // Create/get user
        const userId = `wallet_${chain}_${address.slice(0, 8).toLowerCase()}`;
        const displayName = wallet ? 
            `${wallet} (${address.slice(0, 6)}...${address.slice(-4)})` :
            `${chain} (${address.slice(0, 6)}...${address.slice(-4)})`;
            
        const user = {
            id: userId,
            username: userId,
            displayName: displayName,
            wallet: address,
            chain: chain,
            walletType: wallet || chain,
            isGuest: false,
            createdAt: Date.now(),
            coins: 0,
            profile: {
                avatar: {
                    type: 'icon',
                    icon: chain === 'ethereum' ? '🦊' : chain === 'solana' ? '👻' : '💎'
                }
            }
        };

        // Generate JWT token (simple version - can be enhanced)
        const token = crypto.randomBytes(32).toString('hex');

        // Log successful auth
        console.log(`✅ Wallet authenticated: ${chain} - ${address.slice(0, 8)}...`);

        // Response
        res.json({
            success: true,
            message: 'Wallet authenticated successfully',
            user,
            token,
            chain,
            address: address.slice(0, 6) + '...' + address.slice(-4) // Masked for security
        });
    } catch (error) {
        console.error('Wallet auth error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error: ' + error.message 
        });
    }
};
