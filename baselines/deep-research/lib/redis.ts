import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'
import { CONFIG } from './config'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

// Search: Configurable requests per minute
export const searchRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(CONFIG.rateLimits.search, '1 m'),
})

// Content fetching: Configurable requests per minute
export const fetchContentRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(CONFIG.rateLimits.contentFetch, '1 m'),
})

// Report generation: Configurable requests per minute
export const reportContentRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(CONFIG.rateLimits.reportGeneration, '1 m'),
})
