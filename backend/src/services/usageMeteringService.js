const redis = require('../config/redis');

// Redis keys:
//   usage:{userId}:{YYYY-MM-DD}          hash { bytesIn, bytesOut, requests }
//   usage:period:{subscriptionId}        total bytes used in current billing period (for quota checks)
//   conn:active:{userId}                 count of currently open connections (for concurrency limits)

function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

async function recordUsage({ userId, subscriptionId, bytesIn = 0, bytesOut = 0, requests = 1 }) {
  const day = dayKey();
  const dailyKey = `usage:${userId}:${day}`;
  const periodKey = subscriptionId ? `usage:period:${subscriptionId}` : null;

  const multi = redis.multi();
  multi.hincrby(dailyKey, 'bytesIn', bytesIn);
  multi.hincrby(dailyKey, 'bytesOut', bytesOut);
  multi.hincrby(dailyKey, 'requests', requests);
  multi.expire(dailyKey, 60 * 60 * 24 * 400);
  if (periodKey) {
    multi.incrby(periodKey, bytesIn + bytesOut);
  }
  await multi.exec();

  return periodKey ? Number(await redis.get(periodKey)) : null;
}

async function getPeriodUsageBytes(subscriptionId) {
  const val = await redis.get(`usage:period:${subscriptionId}`);
  return Number(val || 0);
}

async function resetPeriodUsage(subscriptionId) {
  await redis.del(`usage:period:${subscriptionId}`);
}

async function getDailyUsage(userId, days = 30) {
  const results = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
    const key = `usage:${userId}:${dayKey(d)}`;
    // eslint-disable-next-line no-await-in-loop
    const data = await redis.hgetall(key);
    results.push({
      date: dayKey(d),
      bytesIn: Number(data.bytesIn || 0),
      bytesOut: Number(data.bytesOut || 0),
      requests: Number(data.requests || 0),
    });
  }
  return results;
}

async function isOverQuota(subscriptionId, quotaBytes) {
  if (!quotaBytes || quotaBytes <= 0) return false; // unlimited / not bandwidth-based
  const used = await getPeriodUsageBytes(subscriptionId);
  return used >= quotaBytes;
}

async function incrementActiveConnections(userId, delta = 1) {
  const key = `conn:active:${userId}`;
  const val = await redis.incrby(key, delta);
  await redis.expire(key, 3600);
  return val;
}

module.exports = {
  recordUsage,
  getPeriodUsageBytes,
  resetPeriodUsage,
  getDailyUsage,
  isOverQuota,
  incrementActiveConnections,
  dayKey,
};
