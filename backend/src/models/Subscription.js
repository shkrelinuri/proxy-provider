const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },

    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String, index: true },
    stripeCheckoutSessionId: { type: String },

    paddleCustomerId: { type: String },
    paddleSubscriptionId: { type: String, index: true },
    paddleTransactionId: { type: String },

    status: {
      type: String,
      enum: ['incomplete', 'active', 'past_due', 'canceled', 'unpaid', 'trialing'],
      default: 'incomplete',
    },

    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false },

    // quota snapshot for the current period (denormalized for fast checks)
    quotaBytes: { type: Number, default: 0 },
    portQuota: { type: Number, default: 0 },

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);
