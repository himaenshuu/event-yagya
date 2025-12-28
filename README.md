

# Annual Community Festival Event Management App

A secure, full-featured event management application for community gatherings and charitable events.

## Features

- 🎫 Digital donation pass generation with QR codes
- 💳 Secure payment tracking with receipt IDs
- 📅 Event schedule and updates
- 🤖 AI-powered event chatbot (Gemini 2.0)
- 🔐 Admin dashboard with verification
- 📱 Progressive Web App (PWA) support
- 🔒 Serverless API architecture for security
- ⏱️ Rate limiting: 10 requests/min per IP (anti-abuse)

## Run Locally

**Prerequisites:** Node.js 22+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env.local`:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual credentials
   ```

   **Generate admin password hash:**
   ```bash
   node scripts/generate-password-hash.js YourSecurePassword
   # Copy the hash to ADMIN_PASSWORD_HASH in .env.local
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## Deploy to Production (Vercel)

For production deployment with secure serverless functions, see [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md).

**Quick Start:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Important:** Add environment variables to Vercel:
- `GEMINI_API_KEY` - Your Gemini API key
- `ADMIN_PASSWORD_HASH` - SHA-256 hash of admin password

## Security Features

- ✅ API keys hidden via serverless functions
- ✅ Admin authentication via serverless endpoint
- ✅ Password stored as SHA-256 hash (never in plain text)
- ✅ Rate limiting: 10 requests/min per IP (chatbot) + 5 attempts/15min (admin)
- ✅ Message length validation (max 500 characters)
- ✅ Input sanitization and validation
- ✅ SHA-256 verification hashes for donation passes
- ✅ Production console logs removed
- ✅ No hardcoded credentials in client bundle
