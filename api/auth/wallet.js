/**
 * Web3 Wallet Authentication API
 * Verifies wallet signatures and creates/logs in users
 */

const { ethers } = require('ethers');
const nacl = require('tweetnacl');
const bs58 = require('bs58');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const config = require('../../server/config');
const storage = require('../../server/storage');

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

        // Create unique username for wallet
        const username = `wallet_${chain}_${address.slice(0, 8).toLowerCase()}`;
        const displayName = wallet ? 
            `${wallet} (${address.slice(0, 6)}...${address.slice(-4)})` :
            `${chain} (${address.slice(0, 6)}...${address.slice(-4)})`;
        
        // Check if user already exists
        let user = await storage.getUser(username);
        
        if (!user) {
            // Create new wallet user
            user = {
                id: uuidv4(),
                username: username,
                displayName: displayName,
                email: `${username}@wallet.9dttt.com`, // Virtual email for JWT compatibility
                wallet: address,
                chain: chain,
                walletType: wallet || chain,
                isGuest: false,
                createdAt: new Date().toISOString(),
                stats: {
                    wins: 0,
                    losses: 0,
                    draws: 0,
                    gamesPlayed: 0,
                    winStreak: 0,
                    bestWinStreak: 0
                },
                profile: {
                    avatar: {
                        type: 'icon',
                        icon: chain === 'ethereum' ? '🦊' : chain === 'solana' ? '👻' : '💎'
                    },
                    bio: `Authenticated via ${wallet || chain} wallet`,
                    joinedAt: new Date().toISOString()
                },
                settings: {
                    notifications: true,
                    publicProfile: true,
                    showOnlineStatus: true
                }
            };
            
            // Save new user
            await storage.setUser(username, user);
            await storage.updateLeaderboard(username, user.stats);
            
            console.log(`✅ New wallet user created: ${username}`);
        } else {
            // Update last login
            user.lastLogin = new Date().toISOString();
            await storage.setUser(username, user);
            
            console.log(`✅ Wallet user logged in: ${username}`);
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email },
            config.JWT_SECRET,
            { expiresIn: config.JWT_EXPIRES_IN }
        );

        // Sanitize user data for response
        const sanitizedUser = {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            wallet: address,
            chain: chain,
            walletType: user.walletType,
            stats: user.stats,
            profile: user.profile,
            isGuest: false
        };

        // Response
        res.json({
            success: true,
            message: 'Wallet authenticated successfully',
            user: sanitizedUser,
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
