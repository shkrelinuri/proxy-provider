const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const KEY_PREFIX = 'pk_live_';

// Full API key format: pk_live_<prefixPart>_<secretPart>
// We store keyPrefix (public, safe to display) and a bcrypt hash of the full key.
async function generateApiKey() {
  const prefixPart = crypto.randomBytes(4).toString('hex');
  const secretPart = crypto.randomBytes(24).toString('hex');
  const fullKey = `${KEY_PREFIX}${prefixPart}_${secretPart}`;
  const keyHash = await bcrypt.hash(fullKey, 10);
  return { fullKey, keyPrefix: `${KEY_PREFIX}${prefixPart}`, keyHash };
}

async function verifyApiKey(fullKey, keyHash) {
  return bcrypt.compare(fullKey, keyHash);
}

module.exports = { generateApiKey, verifyApiKey, KEY_PREFIX };
