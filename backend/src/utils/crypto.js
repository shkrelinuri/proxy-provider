const crypto = require('crypto');

// Used ONLY to allow the 3proxy config generator (trusted internal network call)
// to retrieve a working plaintext password for its local auth list, since 3proxy
// has no external HTTP auth callout. Customer-facing APIs never decrypt this.
const RAW_KEY = process.env.PROXY_CONFIG_ENC_KEY || 'dev_only_32_byte_key_please_change!!';
const KEY = crypto.createHash('sha256').update(RAW_KEY).digest(); // 32 bytes

function encrypt(plainText) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decrypt(payloadB64) {
  const buf = Buffer.from(payloadB64, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

module.exports = { encrypt, decrypt };
