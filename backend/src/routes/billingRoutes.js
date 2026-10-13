const express = require('express');
const requireAuth = require('../middleware/auth');
const { apiRateLimit } = require('../middleware/rateLimiter');
const billing = require('../controllers/billingController');

const router = express.Router();

router.get('/plans', billing.listPlans); // public pricing page

router.use(requireAuth, apiRateLimit);
router.post('/checkout', billing.createCheckoutSession);
router.post('/portal', billing.createBillingPortalSession);
router.get('/subscriptions', billing.listMySubscriptions);

module.exports = router;
