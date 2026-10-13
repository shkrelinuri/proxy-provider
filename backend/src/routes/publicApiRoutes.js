const express = require('express');
const { requireApiKey, requireScope } = require('../middleware/apiKeyAuth');
const { apiRateLimit } = require('../middleware/rateLimiter');
const proxyController = require('../controllers/proxyController');
const usageService = require('../services/usageMeteringService');

// Public REST API (v1) — authenticated via `Authorization: Bearer pk_live_...` API keys,
// so customers can manage proxies programmatically.
const router = express.Router();
router.use(requireApiKey, apiRateLimit);

router.get('/proxies/servers', requireScope('proxies:read'), proxyController.listAvailableServers);
router.get('/proxies/credentials', requireScope('proxies:read'), proxyController.listCredentials);
router.post('/proxies/credentials/userpass', requireScope('proxies:write'), proxyController.createUserPassCredential);
router.post('/proxies/credentials/whitelist', requireScope('proxies:write'), proxyController.createIpWhitelistCredential);
router.patch('/proxies/credentials/:id', requireScope('proxies:write'), proxyController.updateCredential);
router.delete('/proxies/credentials/:id', requireScope('proxies:write'), proxyController.deleteCredential);
router.get('/proxies/credentials/:id/export', requireScope('proxies:read'), proxyController.exportProxyList);

router.get('/usage/daily', requireScope('usage:read'), async (req, res) => {
  const days = Math.min(parseInt(req.query.days, 10) || 30, 90);
  const series = await usageService.getDailyUsage(req.user._id.toString(), days);
  res.json({ series });
});

module.exports = router;
