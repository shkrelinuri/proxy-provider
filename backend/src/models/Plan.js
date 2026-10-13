const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },

    type: { type: String, enum: ['bandwidth', 'port', 'pay_per_gb'], required: true },

    // bandwidth plans
    bandwidthLimitGB: { type: Number }, // total GB included per billing period
    // port/IP based plans
    portLimit: { type: Number }, // number of dedicated proxy ports/IPs included

    priceCents: { type: Number, required: true }, // recurring price or base price
    pricePerGBCents: { type: Number }, // used for pay_per_gb overage/metered billing
    billingInterval: { type: String, enum: ['month', 'year', 'one_time'], default: 'month' },

    stripeProductId: { type: String },
    stripePriceId: { type: String },
    paddleProductId: { type: String },
    paddlePriceId: { type: String },

    concurrentConnectionLimit: { type: Number, default: 50 },
    requiresIdentityVerification: { type: Boolean, default: false }, // high-volume plans

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Plan', planSchema);
