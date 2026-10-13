const cron = require('node-cron');
const Subscription = require('../models/Subscription');
const ProxyCredential = require('../models/ProxyCredential');
const usageService = require('../services/usageMeteringService');

// Sweeps active subscriptions and disables proxy credentials once the
// customer's quota is exhausted, so they are automatically cut off.
async function enforceQuotas() {
  const subs = await Subscription.find({ status: 'active' });
  let cutOff = 0;

  for (const sub of subs) {
    if (!sub.quotaBytes) continue; // unlimited / non-bandwidth plan
    // eslint-disable-next-line no-await-in-loop
    const overQuota = await usageService.isOverQuota(sub._id.toString(), sub.quotaBytes);
    if (overQuota) {
      // eslint-disable-next-line no-await-in-loop
      const result = await ProxyCredential.updateMany(
        { subscription: sub._id, isActive: true },
        { $set: { isActive: false, disabledReason: 'quota_exceeded' } }
      );
      cutOff += result.modifiedCount || 0;
    }
  }

  if (cutOff) console.log(`[quotaEnforcer] disabled ${cutOff} credentials over quota`);
}

function startQuotaEnforcerJob() {
  cron.schedule('*/5 * * * *', async () => {
    try {
      await enforceQuotas();
    } catch (err) {
      console.error('[quotaEnforcerJob] error', err);
    }
  });
  console.log('[quotaEnforcerJob] scheduled every 5 minutes');
}

module.exports = { startQuotaEnforcerJob, enforceQuotas };
