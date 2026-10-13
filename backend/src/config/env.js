require('dotenv').config();

function list(name, fallback = '') {
  return (process.env[name] || fallback)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

module.exports = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  apiUrl: process.env.API_URL || 'http://localhost:4000',

  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/proxy_provider',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
    accessTtl: process.env.JWT_ACCESS_TTL || '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL || '7d',
  },

  emailVerificationTtlHours: parseInt(process.env.EMAIL_VERIFICATION_TTL_HOURS || '24', 10),

  internalApiSecret: process.env.INTERNAL_API_SECRET || 'changeme',

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    successUrl: process.env.STRIPE_SUCCESS_URL || 'http://localhost:5173/billing/success',
    cancelUrl: process.env.STRIPE_CANCEL_URL || 'http://localhost:5173/billing/cancel',
  },

  paddle: {
    apiKey: process.env.PADDLE_API_KEY,
    webhookSecret: process.env.PADDLE_WEBHOOK_SECRET,
    environment: process.env.PADDLE_ENVIRONMENT || 'sandbox', // 'sandbox' or 'production'
    successUrl: process.env.PADDLE_SUCCESS_URL || 'http://localhost:5173/billing/success',
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'Proxy Provider <no-reply@proxyprovider.com>',
  },

  abuse: {
    blockedPorts: list('BLOCKED_PORTS', '25,465,587,2525').map(Number),
    aupVersion: process.env.AUP_VERSION || '1.0',
    highVolumeBandwidthGB: parseInt(process.env.HIGH_VOLUME_BANDWIDTH_GB || '500', 10),
  },
};
