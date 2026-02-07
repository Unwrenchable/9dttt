# Firebase Google Sign-In Setup

## Current Issue
❌ **Error**: `auth/configuration-not-found`  
📝 **Cause**: Google Sign-In provider not enabled in Firebase Console

## Quick Fix: Enable Google Sign-In

### Option 1: Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **9dttt**
3. Navigate to: **Authentication** → **Sign-in method**
4. Click **Google** provider
5. Click **Enable**
6. Add authorized domains:
   - `9dttt.vercel.app`
   - `localhost` (for testing)
7. Click **Save**

### Option 2: Disable Firebase Social Login
If you don't need Google/Apple sign-in, you can disable it:

**In `server/config.js`:**
```javascript
// Comment out or remove:
// FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID
```

This will hide the Google/Apple buttons and use only:
- 🦊 **Wallet Login** (MetaMask, Phantom, XUMM) - ✅ Working
- 📧 **Email/Password** - ✅ Working  
- 👤 **Guest Login** - ✅ Working

## Working Authentication Methods

All these are already configured and functional:

### 1. Web3 Wallet Login ✅
- **Ethereum**: MetaMask
- **Solana**: Phantom
- **XRP**: XUMM/Crossmark
- **Benefits**: 
  - No password required
  - Perfect for crypto gaming
  - AtomicFizz ecosystem integration

### 2. Email/Password ✅  
- Traditional authentication
- Stored in local database
- No external dependencies

### 3. Guest Login ✅
- Instant access
- No registration
- Progress saved locally

## Why Google Login Fails

Firebase requires explicit configuration for OAuth providers:
1. **API Credentials**: Need Google OAuth client ID/secret
2. **Authorized Domains**: Must whitelist your domains
3. **Firebase Console Setup**: Must enable the provider

The error happens because:
- Firebase SDK is initialized ✅
- But Google provider isn't configured in Firebase Console ❌

## Recommended Solution

Since you have multi-chain wallet authentication working, **I recommend focusing on wallet login** for the AtomicFizz ecosystem. This aligns with:
- XRP/Ripple integration goals
- Crypto gaming audience
- No external service dependencies

If you still want Google login:
1. Follow "Option 1" above
2. Add Google OAuth credentials to Firebase
3. Deploy changes to Render

## Testing After Setup

```bash
# Test locally
http://localhost:3000

# Test production
https://9dttt.vercel.app
```

Try each login method:
- ✅ Wallet (should work now)
- ✅ Email/Password (should work)
- ✅ Guest (should work)
- ⏳ Google (works after Firebase setup)

## Environment Variables

Make sure these are set on Render:
```bash
FIREBASE_PROJECT_ID=your-project-id
# Only needed if using Google/Apple:
# FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

## Support

- Firebase Docs: https://firebase.google.com/docs/auth/web/google-signin
- Current Status: Wallet auth is fully functional
- Recommended: Use wallet login for crypto gaming
