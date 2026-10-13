const mongoose = require('mongoose');

// Daily rollups persisted from Redis counters for charting & billing reconciliation.
const usageDailySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true }, // YYYY-MM-DD (UTC)
    bytesIn: { type: Number, default: 0 },
    bytesOut: { type: Number, default: 0 },
    requests: { type: Number, default: 0 },
  },
  { timestamps: true }
);

usageDailySchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('UsageDaily', usageDailySchema);
