const { RateLimiterRedis } = require('rate-limiter-flexible');
const redis = require('../config/redis');

// Generic per-user/IP rate limiter for API endpoints (separate from proxy bandwidth metering).
const apiLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:api',
  points: 120, // requests
  duration: 60, // per 60s
});

const authLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:auth',
  points: 10,
  duration: 60,
  blockDuration: 300, // block for 5 min after exceeding, to slow credential stuffing / signup abuse
});

function makeMiddleware(limiter, keyFn) {
  return async (req, res, next) => {
    try {
      const key = keyFn ? keyFn(req) : req.ip;
      await limiter.consume(key);
      next();
    } catch (err) {
      res.set('Retry-After', String(Math.ceil((err.msBeforeNext || 1000) / 1000)));
      res.status(429).json({ error: 'Too many requests, please slow down' });
    }
  };
}

module.exports = {
  apiRateLimit: makeMiddleware(apiLimiter, (req) => (req.user ? req.user._id.toString() : req.ip)),
  authRateLimit: makeMiddleware(authLimiter, (req) => `${req.ip}:${req.body?.email || ''}`),
};
