# Quick Start Without Firebase

**Good news!** You don't need Firebase to run 9DTTT. The app works perfectly fine without it.

## What Works Without Firebase? ✅

All of these authentication methods work WITHOUT Firebase:

1. **🦊 Web3 Wallet Login** (Recommended for crypto gaming)
   - MetaMask (Ethereum)
   - Phantom (Solana)
   - XUMM/Crossmark (XRP)
   - No setup required, works immediately!

2. **📧 Email & Password**
   - Traditional registration and login
   - Stored in your own database
   - No external dependencies

3. **👤 Guest Mode**
   - Instant access, no registration
   - Progress saved locally
   - Perfect for trying out games

## What Requires Firebase? 🔑

Firebase is **ONLY** needed for:
- 🔍 Google Sign-In
- 🍎 Apple Sign-In

If you don't need these social login options, **you can skip Firebase entirely**.

## Setup Instructions (No Firebase)

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Environment File
Create a `.env` file with just these essentials:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Authentication (required in production; see .env.example)
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=

# Redis (Optional - will use in-memory storage if not provided)
REDIS_URL=redis://localhost:6379

# That's it! No Firebase needed.
```

### 3. Start the Server
```bash
npm start
```

### 4. Open Your Browser
Navigate to `http://localhost:3000`

## Login Options You'll See

When you open the app, you'll see these login options:

✅ **Always Available:**
- Web3 Wallet Login (MetaMask, Phantom, XUMM)
- Email/Password Registration & Login
- Guest Mode

❌ **Hidden When Firebase Not Configured:**
- Google Sign-In (requires Firebase)
- Apple Sign-In (requires Firebase)

The app automatically hides the Firebase/social login buttons when Firebase is not configured.

## Recommended Setup for Crypto Gaming

Since 9DTTT is a crypto gaming platform with blockchain education features, we recommend:

1. **Use Web3 Wallet Login** as your primary authentication
   - Perfect for your target audience
   - No external service setup required
   - Aligns with Web3/crypto gaming experience

2. **Enable Email/Password** as a backup
   - Already configured and working
   - No setup needed

3. **Skip Firebase** unless you specifically need Google/Apple login
   - Saves setup time
   - One less external dependency
   - Reduces complexity

## Why This Is Better Than Firebase

**Advantages of skipping Firebase:**
- ✅ Zero external service setup
- ✅ No Firebase Console configuration
- ✅ No OAuth credentials needed
- ✅ No authorized domains to manage
- ✅ Works immediately after `npm install`
- ✅ Better for Web3/crypto gaming audience
- ✅ One less point of failure
- ✅ Complete control over your auth flow

## If You Later Want Firebase

If you decide later that you need Google/Apple login:

1. Follow the [Firebase Setup Guide](FIREBASE_SETUP.md)
2. Add Firebase environment variables to `.env`
3. Restart the server
4. Social login buttons will automatically appear

But honestly, for a crypto gaming platform, **wallet authentication is way cooler** and more aligned with your brand! 🚀

## Troubleshooting

### "I see an error about Firebase"
- Make sure you **don't have** any `FIREBASE_*` variables in your `.env` file
- If you copied from `.env.example`, remove or comment out all Firebase lines

### "I want to completely disable Firebase"
Even if Firebase environment variables exist, you can disable it by:

```bash
# In your .env file, comment out or remove:
# FIREBASE_PROJECT_ID=...
```

Without `FIREBASE_PROJECT_ID`, Firebase features are completely disabled.

## Next Steps

1. ✅ Start the server without Firebase
2. ✅ Test Web3 wallet login with MetaMask
3. ✅ Test email/password registration
4. ✅ Test guest mode
5. 🎮 Start playing games!

No Firebase setup required. You're good to go! 🎉
