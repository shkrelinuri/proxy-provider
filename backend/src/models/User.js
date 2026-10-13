const mongoose = require('mongoose');

const identityVerificationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['not_submitted', 'pending', 'approved', 'rejected'],
      default: 'not_submitted',
    },
    provider: { type: String }, // e.g. "manual", "stripe_identity"
    reference: { type: String }, // external verification session id
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    notes: { type: String },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, trim: true },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },

    status: {
      type: String,
      enum: ['pending_verification', 'active', 'suspended', 'banned'],
      default: 'pending_verification',
    },
    suspendedReason: { type: String },
    suspendedAt: { type: Date },

    isEmailVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String },
    emailVerificationExpires: { type: Date },

    passwordResetTokenHash: { type: String },
    passwordResetExpires: { type: Date },

    // Acceptable Use Policy acceptance (required at signup)
    aupAcceptedAt: { type: Date, required: true },
    aupVersion: { type: String, required: true },

    identityVerification: { type: identityVerificationSchema, default: () => ({}) },

    stripeCustomerId: { type: String, index: true },
    paddleCustomerId: { type: String, index: true },

    signupIp: { type: String },
    lastLoginAt: { type: Date },
    lastLoginIp: { type: String },

    // Simple abuse-signal counters, reset periodically
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ status: 1 });

module.exports = mongoose.model('User', userSchema);
