require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Plan = require('../models/Plan');
const { hashPassword } = require('../utils/password');
const { abuse } = require('../config/env');

async function seed() {
  await connectDB();

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@proxyprovider.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';

  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await User.create({
      email: adminEmail,
      passwordHash: await hashPassword(adminPassword),
      fullName: 'Platform Admin',
      role: 'admin',
      status: 'active',
      isEmailVerified: true,
      aupAcceptedAt: new Date(),
      aupVersion: abuse.aupVersion,
    });
    console.log(`[seed] created admin user ${adminEmail} / ${adminPassword}`);
  } else {
    console.log('[seed] admin user already exists');
  }

  const plans = [
    {
      name: 'Starter Bandwidth 50GB',
      slug: 'bandwidth-50gb',
      type: 'bandwidth',
      bandwidthLimitGB: 50,
      priceCents: 1900,
      billingInterval: 'month',
      concurrentConnectionLimit: 20,
    },
    {
      name: 'Pro Bandwidth 500GB',
      slug: 'bandwidth-500gb',
      type: 'bandwidth',
      bandwidthLimitGB: 500,
      priceCents: 12900,
      billingInterval: 'month',
      concurrentConnectionLimit: 100,
      requiresIdentityVerification: true,
      isActive: false, // hidden from pricing page by default, keep only one bandwidth tier visible
    },
    {
      name: 'Dedicated 5 Ports',
      slug: 'ports-5',
      type: 'port',
      portLimit: 5,
      priceCents: 4900,
      billingInterval: 'month',
      concurrentConnectionLimit: 50,
    },
    {
      name: 'Pay-as-you-go per GB',
      slug: 'pay-per-gb',
      type: 'pay_per_gb',
      pricePerGBCents: 80,
      priceCents: 0,
      billingInterval: 'month',
      concurrentConnectionLimit: 50,
      isActive: false, // hidden from pricing page by default
    },
  ];

  for (const plan of plans) {
    // eslint-disable-next-line no-await-in-loop
    await Plan.findOneAndUpdate({ slug: plan.slug }, plan, { upsert: true });
  }
  console.log(`[seed] upserted ${plans.length} plans`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
