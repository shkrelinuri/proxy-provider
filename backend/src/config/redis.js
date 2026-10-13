const Redis = require('ioredis');
const { redisUrl } = require('./env');

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => console.log('[redis] connected'));
redis.on('error', (err) => console.error('[redis] error', err));

module.exports = redis;
