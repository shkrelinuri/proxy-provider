const express = require('express');
const auth = require('../controllers/authController');
const requireAuth = require('../middleware/auth');
const { authRateLimit } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/signup', authRateLimit, auth.signup);
router.post('/verify-email', authRateLimit, auth.verifyEmail);
router.post('/resend-verification', authRateLimit, auth.resendVerification);
router.post('/login', authRateLimit, auth.login);
router.post('/refresh', auth.refresh);
router.post('/forgot-password', authRateLimit, auth.forgotPassword);
router.post('/reset-password', authRateLimit, auth.resetPassword);
router.get('/me', requireAuth, auth.me);

module.exports = router;
