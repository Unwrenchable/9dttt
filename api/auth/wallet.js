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
 * Verify XRP signature (format validation + TODO: full cryptographic check)
 *
 * Full cryptographic verification of an XRPL signature requires the signer's
 * *public key* (not just the address). XUMM/Crossmark wallets handle the actual
 * signing client-side. Until clients are updated to supply the public key, we
 * perform strict format validation to reject trivially-forged signatures.
 *
 * TODO: Update the client to send `publicKey` alongside the signature, then
 * use ripple-keypairs: keypairs.verify(messageHex, signature, publicKey)
 */
function verifyXRPSignature(message, signature, address) {
    try {
        // Validate XRP address format: starts with 'r', 25–35 Base58 characters
        if (!address || !/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(address)) {
            console.warn('XRP verification: invalid address format');
            return false;
        }

        // XRPL DER-encoded signatures are 128 or 130 hex characters (64/65 bytes).
        // Reject anything that is not a valid hex string of the expected length.
        if (!signature || !/^[0-9a-fA-F]{128,130}$/.test(signature)) {
            console.warn('XRP verification: invalid signature format');
            return false;
        }

        // Message must be non-empty
        if (!message || message.length === 0) {
            return false;
        }

        return true;
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

        // --- Replay-attack guard (BUG-8) ---
        // Extract a timestamp from the signed message so stale signatures cannot
        // be replayed. We look for either a 13-digit unix-ms integer or an ISO
        // date string embedded anywhere in the message text.
        const MAX_MESSAGE_AGE_MS = 5 * 60 * 1000; // 5 minutes
        const unixMsMatch = message.match(/\b(\d{13})\b/);
        const isoMatch = message.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)/);
        let messageTimestamp = null;
        if (unixMsMatch) {
            messageTimestamp = parseInt(unixMsMatch[1], 10);
        } else if (isoMatch) {
            const parsed = new Date(isoMatch[1]);
            if (!Number.isNaN(parsed.getTime())) {
                messageTimestamp = parsed.getTime();
            }
        }
        if (messageTimestamp === null) {
            return res.status(400).json({
                success: false,
                error: 'Invalid challenge message: must contain a timestamp. Please sign a fresh message.'
            });
        }
        if (Date.now() - messageTimestamp > MAX_MESSAGE_AGE_MS) {
            return res.status(400).json({
                success: false,
                error: 'Challenge message expired. Please sign a fresh message.'
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

        // Create unique username for wallet (using full address hash for uniqueness)
        const addressHash = require('crypto')
            .createHash('sha256')
            .update(address.toLowerCase())
            .digest('hex')
            .substring(0, 16);
        const username = `w_${chain}_${addressHash}`;
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
                email: `${username}@wallet.reserved.9dttt.internal`, // Reserved domain - cannot be registered
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
