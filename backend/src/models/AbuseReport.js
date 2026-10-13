const mongoose = require('mongoose');

const abuseReportSchema = new mongoose.Schema(
  {
    reporterEmail: { type: String }, // external reporter (e.g. abuse@ complaint)
    reporterOrg: { type: String },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    targetIp: { type: String },
    credential: { type: mongoose.Schema.Types.ObjectId, ref: 'ProxyCredential' },

    category: {
      type: String,
      enum: ['spam', 'fraud', 'malware', 'copyright', 'illegal_content', 'network_abuse', 'other'],
      default: 'other',
    },
    description: { type: String, required: true },
    evidenceUrls: [{ type: String }],

    status: { type: String, enum: ['open', 'investigating', 'action_taken', 'dismissed'], default: 'open' },
    resolution: { type: String },
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AbuseReport', abuseReportSchema);
