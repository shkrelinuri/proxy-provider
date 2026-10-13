const crypto = require('crypto');
const ApiKey = require('../models/ApiKey');
const User = require('../models/User');
const { verifyApiKey } = require('../utils/apiKeyGen');

// Auth for the public REST API using `Authorization: Bearer pk_live_xxx` API keys.
async function requireApiKey(req, res, next) {
  const header = req.headers.authorization || '';
  const fullKey = header.startsWith('Bearer ') ? header.slice(7) : req.headers['x-api-key'];
  if (!fullKey || !fullKey.startsWith('pk_live_')) {
    return res.status(401).json({ error: 'Missing or invalid API key' });
  }

  const keyPrefix = fullKey.split('_').slice(0, 3).join('_'); // pk_live_<prefixPart>
  const candidates = await ApiKey.find({ keyPrefix, isActive: true });

  let matched = null;
  for (const candidate of candidates) {
    if (await verifyApiKey(fullKey, candidate.keyHash)) {
      matched = candidate;
      break;
    }
  }
  if (!matched) return res.status(401).json({ error: 'Invalid API key' });

  const user = await User.findById(matched.user);
  if (!user) return res.status(401).json({ error: 'User not found' });
  if (user.status === 'suspended') return res.status(403).json({ error: 'Account suspended' });
  if (user.status === 'banned') return res.status(403).json({ error: 'Account banned' });

  matched.lastUsedAt = new Date();
  matched.lastUsedIp = req.ip;
  await matched.save();

  req.user = user;
  req.apiKey = matched;
  next();
}

function requireScope(scope) {
  return (req, res, next) => {
    if (!req.apiKey.scopes.includes(scope)) {
      return res.status(403).json({ error: `API key missing required scope: ${scope}` });
    }
    next();
  };
}

module.exports = { requireApiKey, requireScope };
