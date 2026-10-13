const User = require('../models/User');
const Plan = require('../models/Plan');
const ProxyServer = require('../models/ProxyServer');
const ProxyCredential = require('../models/ProxyCredential');
const Subscription = require('../models/Subscription');
const AbuseReport = require('../models/AbuseReport');
const AuditLog = require('../models/AuditLog');
const stripe = require('../config/stripe');

async function audit(req, action, targetType, targetId, metadata) {
  await AuditLog.create({ actor: req.user._id, action, targetType, targetId, metadata, ip: req.ip });
}

// ---- Users ----
async function listUsers(req, res) {
  const { status, q } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (q) filter.email = new RegExp(q, 'i');
  const users = await User.find(filter).select('-passwordHash').sort({ createdAt: -1 }).limit(200);
  res.json({ users });
}

async function suspendUser(req, res) {
  const { reason } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.status = 'suspended';
  user.suspendedReason = reason || 'Suspended by admin';
  user.suspendedAt = new Date();
  await user.save();

  // Instantly cut off all active proxy credentials for this user.
  await ProxyCredential.updateMany({ user: user._id }, { $set: { isActive: false, disabledReason: 'account_suspended' } });

  await audit(req, 'user.suspend', 'User', user._id, { reason });
  res.json({ message: 'User suspended', user });
}

async function reactivateUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.status = 'active';
  user.suspendedReason = undefined;
  user.suspendedAt = undefined;
  await user.save();

  await audit(req, 'user.reactivate', 'User', user._id);
  res.json({ message: 'User reactivated', user });
}

async function setIdentityVerification(req, res) {
  const { status, notes } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.identityVerification.status = status;
  user.identityVerification.notes = notes;
  user.identityVerification.reviewedBy = req.user._id;
  user.identityVerification.reviewedAt = new Date();
  await user.save();

  await audit(req, 'user.identity_verification', 'User', user._id, { status });
  res.json({ message: 'Identity verification updated', user });
}

// ---- Plans ----
async function createPlan(req, res) {
  const plan = await Plan.create(req.body);
  await audit(req, 'plan.create', 'Plan', plan._id, req.body);
  res.status(201).json({ plan });
}

async function updatePlan(req, res) {
  const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!plan) return res.status(404).json({ error: 'Plan not found' });
  await audit(req, 'plan.update', 'Plan', plan._id, req.body);
  res.json({ plan });
}

async function listPlansAdmin(req, res) {
  const plans = await Plan.find().sort({ createdAt: -1 });
  res.json({ plans });
}

// ---- Servers ----
async function addServer(req, res) {
  const server = await ProxyServer.create({ ...req.body, addedBy: req.user._id });
  await audit(req, 'server.add', 'ProxyServer', server._id, req.body);
  res.status(201).json({ server });
}

async function updateServer(req, res) {
  const server = await ProxyServer.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!server) return res.status(404).json({ error: 'Server not found' });
  await audit(req, 'server.update', 'ProxyServer', server._id, req.body);
  res.json({ server });
}

async function removeServer(req, res) {
  const server = await ProxyServer.findByIdAndDelete(req.params.id);
  if (!server) return res.status(404).json({ error: 'Server not found' });
  await audit(req, 'server.remove', 'ProxyServer', server._id);
  res.json({ message: 'Server removed' });
}

async function listServers(req, res) {
  const servers = await ProxyServer.find().sort({ createdAt: -1 });
  res.json({ servers });
}

// ---- Revenue ----
async function revenueSummary(req, res) {
  const activeSubs = await Subscription.countDocuments({ status: 'active' });
  const plans = await Plan.find();
  const planById = new Map(plans.map((p) => [p._id.toString(), p]));

  const subs = await Subscription.find({ status: 'active' });
  let mrrCents = 0;
  for (const sub of subs) {
    const plan = planById.get(sub.plan.toString());
    if (plan && plan.billingInterval === 'month') mrrCents += plan.priceCents;
    if (plan && plan.billingInterval === 'year') mrrCents += Math.round(plan.priceCents / 12);
  }

  let stripeBalance = null;
  try {
    stripeBalance = await stripe.balance.retrieve();
  } catch (err) {
    stripeBalance = { error: 'Unable to reach Stripe' };
  }

  res.json({
    activeSubscriptions: activeSubs,
    estimatedMrrCents: mrrCents,
    stripeBalance,
  });
}

// ---- Abuse reports ----
async function listAbuseReports(req, res) {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const reports = await AbuseReport.find(filter).populate('targetUser', 'email status').sort({ createdAt: -1 });
  res.json({ reports });
}

async function updateAbuseReport(req, res) {
  const { status, resolution } = req.body;
  const report = await AbuseReport.findById(req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });

  report.status = status || report.status;
  report.resolution = resolution;
  report.handledBy = req.user._id;
  if (status === 'action_taken' || status === 'dismissed') report.resolvedAt = new Date();
  await report.save();

  await audit(req, 'abuse_report.update', 'AbuseReport', report._id, { status });
  res.json({ report });
}

module.exports = {
  listUsers,
  suspendUser,
  reactivateUser,
  setIdentityVerification,
  createPlan,
  updatePlan,
  listPlansAdmin,
  addServer,
  updateServer,
  removeServer,
  listServers,
  revenueSummary,
  listAbuseReports,
  updateAbuseReport,
};
