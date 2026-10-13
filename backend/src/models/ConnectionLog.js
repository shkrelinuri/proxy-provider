const mongoose = require('mongoose');

// Connection metadata log — retained for legal / abuse-report handling.
// Does not store proxied payload content, only connection metadata.
const connectionLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    credential: { type: mongoose.Schema.Types.ObjectId, ref: 'ProxyCredential' },
    server: { type: mongoose.Schema.Types.ObjectId, ref: 'ProxyServer' },

    sourceIp: { type: String },
    destHost: { type: String },
    destPort: { type: Number },
    protocol: { type: String, enum: ['http', 'https', 'socks5'] },

    bytesTransferred: { type: Number, default: 0 },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date },

    blocked: { type: Boolean, default: false },
    blockReason: { type: String }, // e.g. "blocked_port", "quota_exceeded", "suspended_account"
  },
  { timestamps: true }
);

connectionLogSchema.index({ user: 1, startedAt: -1 });
connectionLogSchema.index({ startedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 400 }); // ~13 months retention

module.exports = mongoose.model('ConnectionLog', connectionLogSchema);
