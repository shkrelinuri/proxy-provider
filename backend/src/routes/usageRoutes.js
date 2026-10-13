const express = require('express');
const requireAuth = require('../middleware/auth');
const { apiRateLimit } = require('../middleware/rateLimiter');
const usageService = require('../services/usageMeteringService');
const Subscription = require('../models/Subscription');

const router = express.Router();

router.use(requireAuth, apiRateLimit);

// Daily usage series for dashboard charts.
router.get('/daily', async (req, res) => {
  const days = Math.min(parseInt(req.query.days, 10) || 30, 90);
  const series = await usageService.getDailyUsage(req.user._id.toString(), days);
  res.json({ series });
});

// Current billing-period usage vs quota, for the quota progress bar.
router.get('/quota', async (req, res) => {
  const subscription = await Subscription.findOne({ user: req.user._id, status: 'active' })
    .sort({ createdAt: -1 })
    .populate('plan');

  if (!subscription) return res.json({ subscription: null, usedBytes: 0, quotaBytes: 0 });

  const usedBytes = await usageService.getPeriodUsageBytes(subscription._id.toString());
  res.json({
    subscription: {
      id: subscription._id,
      plan: subscription.plan?.name,
      currentPeriodEnd: subscription.currentPeriodEnd,
    },
    usedBytes,
    quotaBytes: subscription.quotaBytes,
    overQuota: subscription.quotaBytes > 0 && usedBytes >= subscription.quotaBytes,
  });
});

module.exports = router;
