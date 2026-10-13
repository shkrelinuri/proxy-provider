const redis = require('../config/redis');
const { sendAnomalyAlertEmail } = require('./emailService');

// Simple anomaly detection: flag sudden spikes vs the trailing average,
// and excessive distinct destination hosts in a short window (possible scanning/abuse).
const ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL || 'abuse@proxyprovider.com';

async function recordDestination(userId, destHost) {
  const key = `anomaly:dest:${userId}`;
  await redis.sadd(key, destHost);
  await redis.expire(key, 600); // 10 minute rolling window
  return redis.scard(key);
}

async function checkBandwidthSpike(userId, currentIntervalBytes) {
  const key = `anomaly:bw:${userId}`;
  const prev = Number((await redis.get(key)) || 0);
  await redis.set(key, currentIntervalBytes, 'EX', 3600);

  if (prev > 0 && currentIntervalBytes > prev * 10 && currentIntervalBytes > 5 * 1024 * 1024 * 1024) {
    await sendAnomalyAlertEmail(ADMIN_ALERT_EMAIL, {
      userId,
      type: 'bandwidth_spike',
      previousBytes: prev,
      currentBytes: currentIntervalBytes,
    });
    return true;
  }
  return false;
}

async function checkDestinationFanOut(userId, destHost) {
  const distinctCount = await recordDestination(userId, destHost);
  if (distinctCount > 200) {
    await sendAnomalyAlertEmail(ADMIN_ALERT_EMAIL, {
      userId,
      type: 'destination_fanout',
      distinctDestinationsLast10Min: distinctCount,
    });
    return true;
  }
  return false;
}

module.exports = { checkBandwidthSpike, checkDestinationFanOut };
