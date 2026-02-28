# Rate Limiting Implementation

## Overview

Rate limiting has been implemented to protect API endpoints from abuse, DDoS attacks, and excessive requests. This helps ensure:
- **Security**: Prevents brute force attacks and API abuse
- **Performance**: Protects server resources from being overwhelmed
- **Cost Control**: Prevents excessive API calls that could increase costs
- **Fair Usage**: Ensures all users have fair access to the API

## Implementation Details

### Rate Limiter Types

The system includes four pre-configured rate limiters with different strictness levels:

1. **Strict** (`rateLimiters.strict`)
   - **Limit**: 5 requests per minute
   - **Used for**: Payment intent creation, order creation
   - **Endpoints**:
     - `POST /api/create-payment-intent`
     - `POST /api/orders/create-from-confirmation`
     - `POST /api/orders/create-cod`

2. **Auth** (`rateLimiters.auth`)
   - **Limit**: 5 requests per 15 minutes
   - **Used for**: Authentication endpoints
   - **Endpoints**:
     - `POST /api/auth/register`

3. **Standard** (`rateLimiters.standard`)
   - **Limit**: 30 requests per minute
   - **Used for**: Admin operations and general API endpoints
   - **Endpoints**:
     - `GET /api/orders` (admin)
     - `POST /api/menu-items` (admin)
     - `PUT /api/menu-items/[id]` (admin)
     - `DELETE /api/menu-items/[id]` (admin)

4. **Lenient** (`rateLimiters.lenient`)
   - **Limit**: 100 requests per minute
   - **Used for**: Read-only public endpoints
   - **Endpoints**: Currently not applied (can be added to public read endpoints if needed)

## How It Works

### Identification
Rate limiting is based on IP address, extracted from:
1. `x-forwarded-for` header (first IP in chain)
2. `x-real-ip` header
3. `cf-connecting-ip` header (Cloudflare)
4. Falls back to 'unknown' if no IP is found

### Storage
- Uses in-memory storage (simple object)
- Automatically cleans up expired entries every 5 minutes
- **Note**: In serverless environments (Vercel), each function instance has its own memory, so limits are per-instance

### Response
When rate limit is exceeded:
- Returns HTTP 429 (Too Many Requests)
- Includes `Retry-After` header with seconds until reset
- Includes rate limit headers:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests (0 when exceeded)
  - `X-RateLimit-Reset`: ISO timestamp when limit resets

## Example Response

```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again in 45 second(s).",
  "retryAfter": 45
}
```

## Production Considerations

### Current Implementation (In-Memory)
- ✅ Simple and fast
- ✅ No external dependencies
- ✅ Works immediately
- ⚠️ Limits are per serverless function instance (not shared across instances)
- ⚠️ Limits reset when function instance restarts

### Recommended Upgrade (For High Traffic)
For production with high traffic, consider upgrading to a Redis-based solution:

1. **Option 1: Upstash Rate Limit** (Recommended for Vercel)
   ```bash
   npm install @upstash/ratelimit @upstash/redis
   ```
   - Serverless Redis
   - Shared rate limits across all instances
   - Free tier available

2. **Option 2: Custom Redis Solution**
   - Use Redis for distributed rate limiting
   - Requires Redis instance (e.g., Upstash, Redis Cloud)

### Migration Path
The current implementation is designed to be easily replaceable. To upgrade:
1. Install Redis-based rate limiting library
2. Replace `lib/rateLimit.ts` with Redis implementation
3. Keep the same `rateLimiters` export structure
4. No changes needed in API routes

## Testing Rate Limits

### Test Rate Limiting Locally
```bash
# Test strict rate limit (5 requests/minute)
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/create-payment-intent \
    -H "Content-Type: application/json" \
    -d '{"items":[],"total":10}'
  echo ""
done
# 6th request should return 429
```

### Monitor Rate Limiting
- Check response headers for rate limit information
- Monitor 429 responses in logs
- Track rate limit hits in analytics

## Configuration

Rate limits can be adjusted in `lib/rateLimit.ts`:

```typescript
export const rateLimiters = {
  strict: rateLimit({
    interval: 60 * 1000,        // Time window (1 minute)
    uniqueTokenPerInterval: 5,  // Max requests
  }),
  // ... other limiters
}
```

## Security Notes

1. **IP-Based Limiting**: Current implementation uses IP addresses. For authenticated endpoints, consider using user ID instead for better accuracy.

2. **Bypass Protection**: Rate limiting is applied before authentication checks, preventing brute force attacks on login endpoints.

3. **Admin Endpoints**: Admin endpoints have rate limiting but also require authentication, providing double protection.

4. **Webhook Endpoints**: Stripe webhooks are not rate-limited (they have their own signature verification).

## Troubleshooting

### Issue: Legitimate users hitting rate limits
**Solution**: Adjust limits in `lib/rateLimit.ts` or implement user-based rate limiting for authenticated users.

### Issue: Rate limits not working across deployments
**Solution**: This is expected with in-memory storage. Upgrade to Redis-based solution for shared limits.

### Issue: Need different limits for different user roles
**Solution**: Modify rate limiter to accept user role and apply different limits based on role.

## Future Enhancements

- [ ] User-based rate limiting for authenticated users
- [ ] Role-based rate limits (admin vs customer)
- [ ] Redis-based distributed rate limiting
- [ ] Rate limit analytics and monitoring
- [ ] Dynamic rate limit adjustment based on server load

