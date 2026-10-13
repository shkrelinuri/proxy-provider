const ApiKey = require('../models/ApiKey');
const { generateApiKey } = require('../utils/apiKeyGen');

async function createApiKey(req, res) {
  const { name, scopes } = req.body;
  const { fullKey, keyPrefix, keyHash } = await generateApiKey();

  const apiKey = await ApiKey.create({
    user: req.user._id,
    name: name || 'API Key',
    keyPrefix,
    keyHash,
    scopes: scopes && scopes.length ? scopes : ['proxies:read'],
  });

  // The full key is only ever shown once.
  res.status(201).json({
    apiKey: { id: apiKey._id, name: apiKey.name, keyPrefix: apiKey.keyPrefix, scopes: apiKey.scopes, key: fullKey },
  });
}

async function listApiKeys(req, res) {
  const keys = await ApiKey.find({ user: req.user._id }).select('-keyHash').sort({ createdAt: -1 });
  res.json({ apiKeys: keys });
}

async function revokeApiKey(req, res) {
  const key = await ApiKey.findOne({ _id: req.params.id, user: req.user._id });
  if (!key) return res.status(404).json({ error: 'API key not found' });
  key.isActive = false;
  key.revokedAt = new Date();
  await key.save();
  res.json({ message: 'API key revoked' });
}

module.exports = { createApiKey, listApiKeys, revokeApiKey };
