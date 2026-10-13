const paddle = require('../config/paddle');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');

// Paddle Billing uses a client-side overlay checkout (Paddle.js), not a server
// redirect URL, so this just validates eligibility and returns what the
// frontend needs to open Paddle.Checkout.open({ items, customer, customData }).
async function createCheckoutSession(req, res) {
  const { planId } = req.body;
  const plan = await Plan.findById(planId);
  if (!plan || !plan.isActive) return res.status(404).json({ error: 'Plan not found' });

  if (!plan.paddlePriceId) {
    return res.status(500).json({ error: 'This plan is not linked to a Paddle price yet. Ask an admin to configure it.' });
  }

  if (plan.requiresIdentityVerification && req.user.identityVerification.status !== 'approved') {
    return res.status(403).json({
      error: 'This plan requires identity/payment verification before purchase. Please complete verification first.',
    });
  }

  res.json({
    priceId: plan.paddlePriceId,
    email: req.user.email,
    customData: { userId: req.user._id.toString(), planId: plan._id.toString() },
  });
}

async function listPlans(req, res) {
  const plans = await Plan.find({ isActive: true }).sort({ priceCents: 1 });
  res.json({ plans });
}

async function listMySubscriptions(req, res) {
  const subs = await Subscription.find({ user: req.user._id }).populate('plan').sort({ createdAt: -1 });
  res.json({ subscriptions: subs });
}

async function createBillingPortalSession(req, res) {
  if (!req.user.paddleCustomerId) {
    return res.status(404).json({ error: 'No billing history yet — purchase a plan first.' });
  }

  const activeSubs = await Subscription.find({ user: req.user._id, paddleSubscriptionId: { $ne: null } });
  const subscriptionIds = activeSubs.map((s) => s.paddleSubscriptionId).filter(Boolean);

  const session = await paddle.customerPortalSessions.create(req.user.paddleCustomerId, subscriptionIds);
  res.json({ url: session.urls.general.overview });
}

module.exports = { createCheckoutSession, listPlans, listMySubscriptions, createBillingPortalSession };
