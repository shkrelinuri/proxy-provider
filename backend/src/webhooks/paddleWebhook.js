const paddle = require('../config/paddle');
const { paddle: paddleConfig } = require('../config/env');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const usageService = require('../services/usageMeteringService');

function gbToBytes(gb) {
  return Math.round((gb || 0) * 1024 * 1024 * 1024);
}

async function upsertSubscriptionFromPaddle(paddleSub, userId, planId) {
  const plan = await Plan.findById(planId);
  const sub = await Subscription.findOneAndUpdate(
    { paddleSubscriptionId: paddleSub.id },
    {
      user: userId,
      plan: planId,
      paddleCustomerId: paddleSub.customerId,
      paddleSubscriptionId: paddleSub.id,
      status: paddleSub.status === 'active' || paddleSub.status === 'trialing' ? 'active' : paddleSub.status,
      currentPeriodStart: paddleSub.currentBillingPeriod ? new Date(paddleSub.currentBillingPeriod.startsAt) : undefined,
      currentPeriodEnd: paddleSub.currentBillingPeriod ? new Date(paddleSub.currentBillingPeriod.endsAt) : undefined,
      cancelAtPeriodEnd: !!paddleSub.scheduledChange && paddleSub.scheduledChange.action === 'cancel',
      quotaBytes: gbToBytes(plan?.bandwidthLimitGB),
      portQuota: plan?.portLimit || 0,
    },
    { upsert: true, new: true }
  );
  return sub;
}

// Raw body handler mounted at POST /webhooks/paddle
module.exports = async function paddleWebhook(req, res) {
  const signature = req.headers['paddle-signature'] || '';
  const rawBody = req.body.toString();

  let event;
  try {
    event = await paddle.webhooks.unmarshal(rawBody, paddleConfig.webhookSecret, signature);
  } catch (err) {
    console.error('[paddle webhook] signature verification failed', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.eventType) {
      case 'transaction.completed': {
        const txn = event.data;
        const { userId } = txn.customData || {};
        if (userId && txn.customerId) {
          await User.findByIdAndUpdate(userId, { paddleCustomerId: txn.customerId });
        }
        break;
      }
      case 'subscription.created':
      case 'subscription.activated':
      case 'subscription.updated': {
        const sub = event.data;
        const { userId, planId } = sub.customData || {};
        if (userId && planId) {
          const savedSub = await upsertSubscriptionFromPaddle(sub, userId, planId);
          await User.findByIdAndUpdate(userId, { paddleCustomerId: sub.customerId });
          if (savedSub.status === 'active') await usageService.resetPeriodUsage(savedSub._id.toString());
        }
        break;
      }
      case 'subscription.canceled':
      case 'subscription.paused': {
        const sub = event.data;
        await Subscription.findOneAndUpdate({ paddleSubscriptionId: sub.id }, { status: 'canceled' });
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error('[paddle webhook] handler error', err);
    return res.status(500).send('Webhook handler error');
  }

  res.json({ received: true });
};
