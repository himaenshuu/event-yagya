

# Maha Satchandi Mahayagya Event Management App

A secure, full-featured event management application for the Maha Satchandi Mahayagya spiritual event.

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
   ```env
   # Gemini API (for local development only)
   GEMINI_API_KEY=your_gemini_api_key
   
   # Appwrite Configuration
   VITE_APPWRITE_ENDPOINT=your_endpoint
   VITE_APPWRITE_PROJECT_ID=your_project_id
   VITE_APPWRITE_DATABASE_ID=your_database_id
   VITE_APPWRITE_COLLECTION_ID=your_collection_id
   VITE_APPWRITE_BUCKET_ID=your_bucket_id
   
   # Admin Password Hash (server-side only)
   # Generate hash using: node scripts/generate-password-hash.js YourPassword
   ADMIN_PASSWORD_HASH=your_sha256_hash_here
   ```

   **Generate admin password hash:**
   ```bash
   node scripts/generate-password-hash.js Admin@Yagya2024
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
