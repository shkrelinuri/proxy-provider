const express = require('express');
const requireAuth = require('../middleware/auth');
const { apiRateLimit } = require('../middleware/rateLimiter');
const proxyController = require('../controllers/proxyController');

const router = express.Router();

router.use(requireAuth, apiRateLimit);

router.get('/servers', proxyController.listAvailableServers);

router.get('/credentials', proxyController.listCredentials);
router.post('/credentials/userpass', proxyController.createUserPassCredential);
router.post('/credentials/whitelist', proxyController.createIpWhitelistCredential);
router.patch('/credentials/:id', proxyController.updateCredential);
router.delete('/credentials/:id', proxyController.deleteCredential);
router.get('/credentials/:id/export', proxyController.exportProxyList);

module.exports = router;
