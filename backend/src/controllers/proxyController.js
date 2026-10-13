const crypto = require('crypto');
const ProxyCredential = require('../models/ProxyCredential');
const ProxyServer = require('../models/ProxyServer');
const Subscription = require('../models/Subscription');
const { hashPassword } = require('../utils/password');
const { encrypt, decrypt } = require('../utils/crypto');
const { toProxyLines, toCsv } = require('../utils/proxyExport');

function generateUsername(userId) {
  return `u${userId.toString().slice(-6)}${crypto.randomBytes(3).toString('hex')}`;
}

function generatePassword() {
  return crypto.randomBytes(9).toString('base64url');
}

async function activeSubscription(userId) {
  return Subscription.findOne({ user: userId, status: 'active' }).sort({ createdAt: -1 }).populate('plan');
}

// Proxies may only be generated once a plan has been paid for and is active.
async function requireActiveSubscription(userId) {
  const sub = await activeSubscription(userId);
  if (!sub) {
    const err = new Error('Please purchase and activate a plan before generating proxies.');
    err.status = 402;
    throw err;
  }
  return sub;
}

async function assertPortQuota(userId, sub) {
  if (!sub.portQuota) return; // 0/undefined = unlimited or not port-based
  const count = await ProxyCredential.countDocuments({ user: userId, isActive: true });
  if (count >= sub.portQuota) {
    const err = new Error(`Port/credential limit reached for your plan (${sub.portQuota})`);
    err.status = 403;
    throw err;
  }
}

// Picks a live server for the customer, preferring the least-loaded one.
async function pickServer(allowedServerIds) {
  const filter = { status: 'active' };
  if (Array.isArray(allowedServerIds) && allowedServerIds.length) {
    filter._id = { $in: allowedServerIds };
  }
  const server = await ProxyServer.findOne(filter).sort({ currentConnections: 1 });
  if (!server) {
    const err = new Error('No available proxy servers right now, please try again shortly.');
    err.status = 503;
    throw err;
  }
  return server;
}

function credentialLine(credential, server) {
  const port = credential.protocol === 'socks5' ? server.ports.socks5 : server.ports.http;
  if (credential.authType === 'ip_whitelist') return `${server.host}:${port}`;
  return `${server.host}:${port}:${credential.username}:${credential._plainPassword || '<hidden>'}`;
}

async function createUserPassCredential(req, res) {
  const sub = await requireActiveSubscription(req.user._id);
  await assertPortQuota(req.user._id, sub);

  const { label, allowedServerIds, protocol } = req.body;
  const server = await pickServer(allowedServerIds);
  const username = generateUsername(req.user._id);
  const plainPassword = generatePassword();
  const passwordHash = await hashPassword(plainPassword);

  const credential = await ProxyCredential.create({
    user: req.user._id,
    subscription: sub._id,
    label,
    authType: 'userpass',
    username,
    passwordHash,
    passwordEncrypted: encrypt(plainPassword),
    assignedServer: server._id,
    protocol: protocol === 'socks5' ? 'socks5' : 'http',
    allowedServers: [server._id],
  });

  // Plaintext password is returned exactly once at creation time; never stored in plaintext.
  res.status(201).json({
    credential: {
      id: credential._id,
      label: credential.label,
      authType: credential.authType,
      username: credential.username,
      password: plainPassword,
      protocol: credential.protocol,
      ip: server.host,
      port: credential.protocol === 'socks5' ? server.ports.socks5 : server.ports.http,
      isActive: credential.isActive,
    },
  });
}

async function createIpWhitelistCredential(req, res) {
  const sub = await requireActiveSubscription(req.user._id);
  await assertPortQuota(req.user._id, sub);

  const { label, ips, allowedServerIds, protocol } = req.body;
  if (!Array.isArray(ips) || ips.length === 0) {
    return res.status(400).json({ error: 'ips (array) is required for IP whitelist credentials' });
  }

  const server = await pickServer(allowedServerIds);

  const credential = await ProxyCredential.create({
    user: req.user._id,
    subscription: sub._id,
    label,
    authType: 'ip_whitelist',
    whitelistedIps: ips,
    assignedServer: server._id,
    protocol: protocol === 'socks5' ? 'socks5' : 'http',
    allowedServers: [server._id],
  });

  res.status(201).json({
    credential: {
      id: credential._id,
      label: credential.label,
      authType: credential.authType,
      whitelistedIps: credential.whitelistedIps,
      protocol: credential.protocol,
      ip: server.host,
      port: credential.protocol === 'socks5' ? server.ports.socks5 : server.ports.http,
      isActive: credential.isActive,
    },
  });
}

async function listCredentials(req, res) {
  const credentials = await ProxyCredential.find({ user: req.user._id })
    .select('-passwordHash -passwordEncrypted')
    .populate('assignedServer', 'host ports region')
    .sort({ createdAt: -1 });
  res.json({ credentials });
}

async function updateCredential(req, res) {
  const credential = await ProxyCredential.findOne({ _id: req.params.id, user: req.user._id });
  if (!credential) return res.status(404).json({ error: 'Credential not found' });

  const { label, ips, isActive } = req.body;
  if (label !== undefined) credential.label = label;
  if (ips !== undefined) credential.whitelistedIps = ips;
  if (isActive !== undefined) credential.isActive = isActive;

  await credential.save();
  res.json({ credential });
}

async function deleteCredential(req, res) {
  const credential = await ProxyCredential.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!credential) return res.status(404).json({ error: 'Credential not found' });
  res.json({ message: 'Credential deleted' });
}

async function listAvailableServers(req, res) {
  const servers = await ProxyServer.find({ status: 'active' }).select('label host ports protocols region');
  res.json({ servers });
}

async function exportProxyList(req, res) {
  const credential = await ProxyCredential.findOne({ _id: req.params.id, user: req.user._id }).populate('assignedServer');
  if (!credential) return res.status(404).json({ error: 'Credential not found' });
  if (!credential.assignedServer) return res.status(409).json({ error: 'No server assigned to this credential yet' });

  if (credential.authType === 'userpass' && credential.passwordEncrypted) {
    credential._plainPassword = decrypt(credential.passwordEncrypted);
  }

  const format = req.query.format || 'txt';
  const servers = [credential.assignedServer];

  if (format === 'csv') {
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', `attachment; filename="proxy-${credential.username || credential._id}.csv"`);
    return res.send(toCsv(credential, servers));
  }

  const lines = toProxyLines(credential, servers);
  res.set('Content-Type', 'text/plain');
  res.set('Content-Disposition', `attachment; filename="proxy-${credential.username || credential._id}.txt"`);
  res.send(lines.join('\n'));
}

module.exports = {
  createUserPassCredential,
  createIpWhitelistCredential,
  listCredentials,
  updateCredential,
  deleteCredential,
  listAvailableServers,
  exportProxyList,
};
