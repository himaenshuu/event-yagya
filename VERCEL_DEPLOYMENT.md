# Vercel Serverless Deployment Guide

## Overview
The Gemini API key has been secured using Vercel serverless functions. The API key is now stored server-side and never exposed to the client.

## 🔒 Security Features

- **API Key Protection**: Gemini API key stored server-side only
- **Rate Limiting**: 10 requests per minute per IP address
- **Message Validation**: Maximum 500 characters per message
- **Input Sanitization**: Prevents injection attacks
- **IP-Based Tracking**: Uses `x-forwarded-for` header for rate limiting

## Rate Limiting Details

The API endpoint includes built-in anti-abuse protection:
- **Limit**: 10 requests per minute per IP address
- **Window**: 1 minute rolling window
- **Response Headers**: 
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: When the rate limit resets (ISO timestamp)
  - `Retry-After`: Seconds to wait before retrying (on 429 errors)

When rate limit is exceeded, users receive a friendly message asking them to wait before sending another question.

**Note**: The in-memory rate limiter resets on serverless cold starts. For production-grade persistent rate limiting, consider integrating [Upstash Redis](https://upstash.com/) or [Vercel KV](https://vercel.com/docs/storage/vercel-kv).

## Setup Steps

### 1. Install Vercel CLI (if not already installed)
```bash
npm i -g vercel
```

### 2. Install Required Dependencies
```bash
npm install @google/generative-ai
npm install -D @vercel/node
```

### 3. Configure Environment Variables in Vercel

#### Option A: Via Vercel Dashboard
1. Go to your project on [vercel.com](https://vercel.com)
2. Navigate to: **Settings** → **Environment Variables**
3. Add the following variable:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Your Gemini API key (from `.env.local`)
   - **Environment**: Production, Preview, Development (select all)

#### Option B: Via Vercel CLI
```bash
vercel env add GEMINI_API_KEY
# Paste your API key when prompted
# Select: Production, Preview, Development
```

### 4. Deploy to Vercel

#### First-time Deployment
```bash
vercel
```
Follow the prompts:
- Set up and deploy? **Y**
- Which scope? (Select your account)
- Link to existing project? **N** (or **Y** if you have one)
- What's your project's name? `community-festival-app`
- In which directory is your code located? `./`
- Want to override settings? **N**

#### Subsequent Deployments
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### 5. Update Environment Variables Locally (Optional)
If testing locally with Vercel CLI:
```bash
# Create .env file for local Vercel development
echo "GEMINI_API_KEY=your_api_key_here" > .env
```

### 6. Local Development with Vercel
```bash
# Install dependencies
npm install

# Run Vercel dev server (includes serverless functions)
vercel dev
```

## Architecture

### Before (Insecure)
```
Client Browser → Gemini API (API key in bundle) ❌
```

### After (Secure)
```
Client Browser → Vercel Serverless Function → Gemini API ✅
                  ↓
              Rate Limiter (10/min per IP)
              API Key (server-side only)
```

## Files Changed

### New Files
- `api/chat.ts` - Vercel serverless function endpoint with rate limiting
- `vercel.json` - Vercel configuration for routing and env

### Modified Files
- `services/geminiService.ts` - Now calls `/api/chat` endpoint with rate limit error handling
- `vite.config.ts` - Removed `process.env.API_KEY` and `process.env.GEMINI_API_KEY`

## API Endpoint

### POST `/api/chat`

**Headers:**
```
Content-Type: application/json
```

**Request:**
```json
{
  "message": "What is the event about?"
}
```

**Response Headers:**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 2025-12-26T10:30:00.000Z
```

**Response (Success - 200):**
```json
{
  "response": "The Annual Community Festival is a community gathering event..."
}
```

**Response (Rate Limit - 429):**
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again in 45 seconds.",
  "retryAfter": 45
}
```

**Response (Bad Request - 400):**
```json
{
  "error": "Message too long",
  "message": "Message must be 500 characters or less"
}
```

**Response (Server Error - 500):**
```json
{
  "error": "Failed to generate response",
  "details": "API key not configured"
}
```

## Testing

### Test the API Endpoint
```bash
# After deployment, test with curl:
curl -X POST https://your-app.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me about the event"}'
```

### Test Rate Limiting
```bash
# Send 11 requests quickly to trigger rate limit:
for i in {1..11}; do
  echo "Request $i:"
  curl -X POST https://your-app.vercel.app/api/chat \
    -H "Content-Type: application/json" \
    -d '{"message": "Test"}' \
    -i | grep -E "(HTTP|X-RateLimit|Retry-After)"
  echo ""
done
```

The 11th request should return a 429 status with rate limit information.

### Verify API Key Security
1. Open browser DevTools (F12)
2. Go to Sources tab
3. Search all files for your API key
4. ✅ Should NOT find it anywhere in the bundle

## Troubleshooting

### API returns 500 error
- Check that `GEMINI_API_KEY` is set in Vercel environment variables
- Redeploy: `vercel --prod`

### CORS errors
- Not applicable - same-origin requests (frontend and API on same domain)

### "API key not configured" error
```bash
# Verify environment variable is set
vercel env ls

# If missing, add it:
vercel env add GEMINI_API_KEY
```

### Local development not working
```bash
# Make sure you're using vercel dev, not vite
vercel dev

# Not: npm run dev (this won't include serverless functions)
```

## Production Checklist
- [ ] Environment variable `GEMINI_API_KEY` added to Vercel
- [ ] Deployed to production: `vercel --prod`
- [ ] Tested chatbot functionality on live site
- [ ] Verified API key not in browser bundle (DevTools search)
- [ ] Checked Vercel function logs for errors
- [ ] Tested rate limiting (send 11 requests quickly)
- [ ] Verified rate limit headers in response

## Cost Considerations
- **Vercel Free Tier**: 100GB bandwidth, 100 serverless function invocations per day
- **Rate Limiting**: Built-in protection (10 requests/min per IP) helps manage costs
- **In-Memory Storage**: Rate limits reset on cold starts (typically 5-10 minutes of inactivity)
- If you exceed limits or need persistent rate limiting, consider:
  - [Upstash Redis](https://upstash.com/) for persistent rate limit storage
  - [Vercel KV](https://vercel.com/docs/storage/vercel-kv) for edge-compatible storage

## Next Steps (Optional Improvements)
1. ✅ ~~Add rate limiting to `/api/chat` endpoint~~ (Already implemented)
2. Implement request caching for common questions (reduce API costs)
3. Upgrade to persistent rate limiting with Upstash Redis
4. Add admin dashboard for monitoring API usage
5. Monitor Gemini API usage in Google Cloud Console
6. Add request/response logging for analytics

## Advanced: Persistent Rate Limiting with Upstash

For production-grade rate limiting that persists across serverless cold starts:

```bash
# Install Upstash Redis SDK
npm install @upstash/redis

# Add to Vercel env:
# UPSTASH_REDIS_REST_URL
# UPSTASH_REDIS_REST_TOKEN
```

Update [api/chat.ts](api/chat.ts) to use Redis instead of in-memory Map for tracking requests.
