import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory rate limiter
// For production, consider using Redis-based solution like @upstash/ratelimit
interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

// Clean up old entries every 5 minutes
if (typeof global !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    Object.keys(store).forEach((key) => {
      if (store[key].resetTime < now) {
        delete store[key]
      }
    })
  }, 5 * 60 * 1000)
}

export interface RateLimitOptions {
  interval: number // Time window in milliseconds
  uniqueTokenPerInterval: number // Max requests per interval
}

export function rateLimit(options: RateLimitOptions) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    // Get identifier (IP address or user ID)
    const identifier = getIdentifier(request)
    const now = Date.now()
    const windowStart = now - options.interval

    // Get or create rate limit entry
    const record = store[identifier]
    
    if (!record || record.resetTime < now) {
      // Create new record
      store[identifier] = {
        count: 1,
        resetTime: now + options.interval,
      }
      return null // Allow request
    }

    // Check if limit exceeded
    if (record.count >= options.uniqueTokenPerInterval) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000)
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded. Please try again in ${retryAfter} second(s).`,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': options.uniqueTokenPerInterval.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(record.resetTime).toISOString(),
          },
        }
      )
    }

    // Increment count
    record.count++
    return null // Allow request
  }
}

function getIdentifier(request: NextRequest): string {
  // Try to get IP address from various headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown'
  
  // For authenticated users, you could use user ID instead
  // This would require passing the session/user ID to the rate limiter
  return ip
}

// Pre-configured rate limiters for different endpoint types
export const rateLimiters = {
  // Strict limits for payment and order creation
  strict: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 5, // 5 requests per minute
  }),
  
  // Moderate limits for authentication
  auth: rateLimit({
    interval: 15 * 60 * 1000, // 15 minutes
    uniqueTokenPerInterval: 5, // 5 requests per 15 minutes
  }),
  
  // Standard limits for general API endpoints
  standard: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 30, // 30 requests per minute
  }),
  
  // Lenient limits for read-only endpoints
  lenient: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 100, // 100 requests per minute
  }),
}

