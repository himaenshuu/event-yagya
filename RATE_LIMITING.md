# Rate Limiting Implementation

## Overview
Anti-abuse mechanism implemented to prevent excessive API usage and manage server costs.

## Configuration

### Current Limits
- **Rate**: 10 requests per minute per IP address
- **Window**: 60 seconds rolling window
- **Max Message Length**: 500 characters
- **Storage**: In-memory (resets on cold starts)

### Adjusting Limits
Edit [api/chat.ts](api/chat.ts):
```typescript
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;  // 10 requests
const MAX_MESSAGE_LENGTH = 500;      // 500 characters
```

## How It Works

### 1. IP Tracking
```
User Request → Extract IP from x-forwarded-for header → Check rate limit store
```

### 2. Rate Limit Check
```typescript
// First request in window
if (!record || now > record.resetTime) {
  // Create new record, allow request
}

// Subsequent requests
if (record.count >= MAX_REQUESTS_PER_WINDOW) {
  // Return 429 Too Many Requests
} else {
  // Increment counter, allow request
}
```

### 3. Response Headers
Every response includes:
- `X-RateLimit-Limit`: Maximum requests allowed (10)
- `X-RateLimit-Remaining`: Requests remaining (0-9)
- `X-RateLimit-Reset`: When limit resets (ISO timestamp)
- `Retry-After`: Seconds to wait (only on 429 errors)

## User Experience

### Normal Usage
```
User asks question → Gets AI response
Headers show: X-RateLimit-Remaining: 9
```

### Rate Limit Hit
```
User exceeds 10 requests/minute → Gets friendly message
"⏱️ You've reached the rate limit. Please wait 45 seconds before asking another question."
```

## Testing

### Local Testing
```bash
# Start Vercel dev server
vercel dev

# Send test requests
for i in {1..11}; do
  echo "Request $i"
  curl -X POST http://localhost:3000/api/chat \
    -H "Content-Type: application/json" \
    -d '{"message": "Test"}' | jq
done
```

### Production Testing
```bash
# Test on deployed app
curl -X POST https://your-app.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me about the event"}' \
  -i | grep -E "(HTTP|X-RateLimit)"
```

## Limitations

### In-Memory Storage
- ✅ **Pros**: Simple, no external dependencies, zero cost
- ❌ **Cons**: Resets on serverless cold starts (5-10 min inactivity)
- ❌ **Cons**: Not shared across regions/edge nodes

### When to Upgrade
Consider persistent storage (Upstash Redis/Vercel KV) if:
- You need strict rate limiting across cold starts
- You're on Vercel's edge network (multi-region)
- You need shared rate limits across multiple functions
- You want to track usage analytics

## Upgrade Path: Persistent Rate Limiting

### Option 1: Upstash Redis (Recommended)

**Setup:**
```bash
# 1. Create account at upstash.com
# 2. Create Redis database
# 3. Install SDK
npm install @upstash/redis

# 4. Add env variables to Vercel:
# UPSTASH_REDIS_REST_URL
# UPSTASH_REDIS_REST_TOKEN
```

**Implementation:**
```typescript
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

async function checkRateLimit(ip: string) {
  const key = `ratelimit:${ip}`;
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, 60); // 60 seconds
  }
  
  return count <= MAX_REQUESTS_PER_WINDOW;
}
```

**Cost**: Free tier includes 10,000 requests/day

### Option 2: Vercel KV

**Setup:**
```bash
# 1. Enable in Vercel dashboard
# 2. Install SDK
npm install @vercel/kv

# 3. Env vars added automatically by Vercel
```

**Implementation:**
```typescript
import { kv } from '@vercel/kv';

async function checkRateLimit(ip: string) {
  const key = `ratelimit:${ip}`;
  const count = await kv.incr(key);
  
  if (count === 1) {
    await kv.expire(key, 60);
  }
  
  return count <= MAX_REQUESTS_PER_WINDOW;
}
```

**Cost**: Free tier includes 30,000 requests/month

## Monitoring

### Check Rate Limit Status
```bash
# View rate limit headers
curl -I -X POST https://your-app.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
```

### Vercel Logs
```bash
# View function logs
vercel logs

# Filter for rate limit events
vercel logs | grep "429"
```

### Analytics Dashboard (Future)
Consider adding to track:
- Requests per hour/day
- Rate limit hits per IP
- Most active users
- Peak usage times

## Security Considerations

### IP Spoofing
- Vercel handles `x-forwarded-for` header securely
- Users cannot spoof their IP on Vercel infrastructure
- Multi-level proxy support (takes first IP in chain)

### DDoS Protection
- Rate limiting provides basic DDoS protection
- For advanced protection, consider Vercel's Edge Middleware
- Cloudflare integration available for additional layer

### Privacy
- IP addresses stored temporarily (in-memory)
- No IP logging to disk by default
- GDPR compliant (no persistent storage of IPs)

## Troubleshooting

### Users Reporting False Rate Limits
1. Check if behind corporate proxy (shared IP)
2. Verify rate limit window in code
3. Check Vercel function logs for actual request count
4. Consider upgrading to persistent storage

### Rate Limits Not Working
1. Verify `x-forwarded-for` header present
2. Check Vercel function logs
3. Test locally with `vercel dev`
4. Ensure code deployed with `vercel --prod`

### Cold Starts Resetting Limits
1. This is expected behavior with in-memory storage
2. Consider persistent storage (Upstash/Vercel KV)
3. Or accept as acceptable trade-off for simplicity

## Best Practices

1. **Set reasonable limits**: 10/min balances UX and cost
2. **Provide clear error messages**: Tell users how long to wait
3. **Include retry headers**: `Retry-After` helps automated clients
4. **Monitor usage**: Watch for abuse patterns
5. **Consider user tiers**: VIP users could have higher limits
6. **Log rate limit hits**: Track potential abuse attempts

## Future Enhancements

- [ ] Per-user rate limiting (requires authentication)
- [ ] Different limits for different endpoints
- [ ] Admin bypass for testing
- [ ] Whitelist/blacklist IP addresses
- [ ] Graceful degradation (queue requests)
- [ ] Real-time usage dashboard
