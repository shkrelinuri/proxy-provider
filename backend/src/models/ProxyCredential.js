const mongoose = require('mongoose');

// Credential used by the customer to authenticate against proxy servers
// (username/password) OR an IP whitelist entry (no password required).
const proxyCredentialSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },

    label: { type: String },
    authType: { type: String, enum: ['userpass', 'ip_whitelist'], required: true },

    username: { type: String, unique: true, sparse: true, index: true },
    passwordHash: { type: String }, // bcrypt hash validated by internal auth endpoint
    passwordEncrypted: { type: String }, // AES-GCM blob, decrypted only for 3proxy config generation

    whitelistedIps: [{ type: String }], // used when authType === 'ip_whitelist'

    // Each credential is bound to exactly one live server + protocol, so the
    // customer gets a single ready-to-use ip:port:user:pass line (like a purchased IP).
    assignedServer: { type: mongoose.Schema.Types.ObjectId, ref: 'ProxyServer' },
    protocol: { type: String, enum: ['http', 'socks5'], default: 'http' },

    allowedServers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProxyServer' }], // empty = all pool servers
    allowedProtocols: [{ type: String, enum: ['http', 'https', 'socks5'], default: ['http', 'https', 'socks5'] }],

    isActive: { type: Boolean, default: true },
    disabledReason: { type: String }, // e.g. "quota_exceeded", "suspended_by_admin"

    maxBandwidthBytes: { type: Number }, // per-credential override, optional
    lastUsedAt: { type: Date },
  },
  { timestamps: true }
);

proxyCredentialSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model('ProxyCredential', proxyCredentialSchema);
