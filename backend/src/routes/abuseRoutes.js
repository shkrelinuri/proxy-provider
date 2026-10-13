const express = require('express');
const AbuseReport = require('../models/AbuseReport');
const User = require('../models/User');
const { authRateLimit } = require('../middleware/rateLimiter');

// Public endpoint so third parties (e.g. mail providers, blocklist maintainers)
// can submit an abuse report without needing an account.
const router = express.Router();

router.post('/', authRateLimit, async (req, res) => {
  const { reporterEmail, reporterOrg, targetIp, category, description, evidenceUrls } = req.body;
  if (!description) return res.status(400).json({ error: 'description is required' });

  let targetUser;
  if (targetIp) {
    // Best-effort lookup: connection logs map source/dest activity back to a user via ConnectionLog.
    const ConnectionLog = require('../models/ConnectionLog');
    const log = await ConnectionLog.findOne({ destHost: targetIp }).sort({ createdAt: -1 });
    if (log) targetUser = log.user;
  }

  const report = await AbuseReport.create({
    reporterEmail,
    reporterOrg,
    targetUser,
    targetIp,
    category,
    description,
    evidenceUrls,
  });

  res.status(201).json({ message: 'Abuse report submitted', reportId: report._id });
});

module.exports = router;
