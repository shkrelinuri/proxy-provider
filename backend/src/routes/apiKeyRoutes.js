const express = require('express');
const requireAuth = require('../middleware/auth');
const { apiRateLimit } = require('../middleware/rateLimiter');
const apiKeyController = require('../controllers/apiKeyController');

const router = express.Router();
router.use(requireAuth, apiRateLimit);

router.get('/', apiKeyController.listApiKeys);
router.post('/', apiKeyController.createApiKey);
router.delete('/:id', apiKeyController.revokeApiKey);

module.exports = router;
