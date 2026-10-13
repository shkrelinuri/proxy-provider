const mongoose = require('mongoose');

const proxyServerSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    host: { type: String, required: true }, // IP or hostname
    region: { type: String },

    ports: {
      http: { type: Number, default: 3128 },
      socks5: { type: Number, default: 1080 },
    },
    protocols: [{ type: String, enum: ['http', 'https', 'socks5'], default: ['http', 'https', 'socks5'] }],

    engine: { type: String, enum: ['3proxy', 'squid'], default: '3proxy' },

    status: { type: String, enum: ['active', 'maintenance', 'dead'], default: 'active' },
    lastHealthCheckAt: { type: Date },
    lastHealthOk: { type: Boolean },
    lastLatencyMs: { type: Number },
    consecutiveFailures: { type: Number, default: 0 },

    maxConnections: { type: Number, default: 1000 },
    currentConnections: { type: Number, default: 0 },

    ipRangeCidr: { type: String }, // for pool documentation / allocation
    tags: [{ type: String }],

    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

proxyServerSchema.index({ status: 1 });

module.exports = mongoose.model('ProxyServer', proxyServerSchema);
