const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, default: 'Default API Key' },
    keyPrefix: { type: String, required: true, index: true }, // first 8 chars shown to user
    keyHash: { type: String, required: true }, // sha256 hash of full key
    scopes: [{ type: String, enum: ['proxies:read', 'proxies:write', 'usage:read'], default: ['proxies:read'] }],
    isActive: { type: Boolean, default: true },
    lastUsedAt: { type: Date },
    lastUsedIp: { type: String },
    revokedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ApiKey', apiKeySchema);
