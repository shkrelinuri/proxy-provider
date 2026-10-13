const express = require('express');
const bcrypt = require('bcryptjs');
const ProxyCredential = require('../models/ProxyCredential');
const ProxyServer = require('../models/ProxyServer');
const Subscription = require('../models/Subscription');
const ConnectionLog = require('../models/ConnectionLog');
const usageService = require('../services/usageMeteringService');
const anomalyService = require('../services/anomalyService');
const { isBlockedPort, DEFAULT_BLOCKED_PORTS } = require('../utils/blockedPorts');
const { decrypt } = require('../utils/crypto');
const { internalApiSecret } = require('../config/env');

const router = express.Router();

// All /internal routes are only reachable from trusted proxy containers on the
// docker network and require a shared secret header.
router.use((req, res, next) => {
  if (req.headers['x-internal-secret'] !== internalApiSecret) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
});

// Called by 3proxy/Squid's auth callout script to validate username/password
// or source-IP whitelist before allowing a connection.
router.post('/auth/validate', async (req, res) => {
  const { username, password, sourceIp } = req.body;

  let credential;
  if (username) {
    credential = await ProxyCredential.findOne({ username, authType: 'userpass', isActive: true });
    if (!credential || !password) return res.json({ allow: false, reason: 'invalid_credentials' });
    const ok = await bcrypt.compare(password, credential.passwordHash);
    if (!ok) return res.json({ allow: false, reason: 'invalid_credentials' });
  } else if (sourceIp) {
    credential = await ProxyCredential.findOne({
      authType: 'ip_whitelist',
      isActive: true,
      whitelistedIps: sourceIp,
    });
    if (!credential) return res.json({ allow: false, reason: 'ip_not_whitelisted' });
  } else {
    return res.json({ allow: false, reason: 'no_credentials_supplied' });
  }

  const User = require('../models/User');
  const user = await User.findById(credential.user);
  if (!user || user.status !== 'active') {
    return res.json({ allow: false, reason: 'account_not_active' });
  }

  if (credential.subscription) {
    const sub = await Subscription.findById(credential.subscription);
    if (sub && (await usageService.isOverQuota(sub._id.toString(), sub.quotaBytes))) {
      return res.json({ allow: false, reason: 'quota_exceeded' });
    }
  }

  res.json({ allow: true, userId: user._id, credentialId: credential._id, subscriptionId: credential.subscription });
});

// Called before a CONNECT/forward to a destination host:port, to enforce
// blocked-port abuse prevention (SMTP relays, etc.) independent of client auth.
router.post('/auth/check-destination', async (req, res) => {
  const { destPort } = req.body;
  if (isBlockedPort(destPort)) {
    return res.json({ allow: false, reason: 'blocked_port' });
  }
  res.json({ allow: true });
});

// Called periodically / at connection close by the proxy to report usage &
// write connection metadata logs.
router.post('/usage/report', async (req, res) => {
  const {
    userId,
    credentialId,
    subscriptionId,
    serverId,
    sourceIp,
    destHost,
    destPort,
    protocol,
    bytesIn,
    bytesOut,
    startedAt,
    endedAt,
    blocked,
    blockReason,
  } = req.body;

  if (!blocked) {
    await usageService.recordUsage({ userId, subscriptionId, bytesIn, bytesOut });
    anomalyService.checkBandwidthSpike(userId, (bytesIn || 0) + (bytesOut || 0)).catch(() => {});
    if (destHost) anomalyService.checkDestinationFanOut(userId, destHost).catch(() => {});
  }

  await ConnectionLog.create({
    user: userId,
    credential: credentialId,
    server: serverId,
    sourceIp,
    destHost,
    destPort,
    protocol,
    bytesTransferred: (bytesIn || 0) + (bytesOut || 0),
    startedAt: startedAt ? new Date(startedAt) : new Date(),
    endedAt: endedAt ? new Date(endedAt) : undefined,
    blocked: !!blocked,
    blockReason,
  });

  res.json({ ok: true });
});

// Polled periodically by the 3proxy container's config generator, since 3proxy
// has no native HTTP auth callout and instead needs a local user/password list.
router.get('/proxy-config', async (req, res) => {
  const credentials = await ProxyCredential.find({ isActive: true }).populate('user', 'status');

  const userpass = [];
  const whitelist = [];

  for (const cred of credentials) {
    if (!cred.user || cred.user.status !== 'active') continue;

    if (cred.authType === 'userpass' && cred.passwordEncrypted) {
      try {
        userpass.push({ username: cred.username, password: decrypt(cred.passwordEncrypted) });
      } catch (err) {
        // skip credentials that fail to decrypt rather than crash config generation
      }
    } else if (cred.authType === 'ip_whitelist') {
      whitelist.push(...cred.whitelistedIps);
    }
  }

  res.json({
    userpass,
    whitelist,
    blockedPorts: Array.from(DEFAULT_BLOCKED_PORTS),
  });
});

module.exports = router;
