const express = require('express');
const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/adminOnly');
const { apiRateLimit } = require('../middleware/rateLimiter');
const admin = require('../controllers/adminController');

const router = express.Router();

router.use(requireAuth, requireAdmin, apiRateLimit);

router.get('/users', admin.listUsers);
router.post('/users/:id/suspend', admin.suspendUser);
router.post('/users/:id/reactivate', admin.reactivateUser);
router.post('/users/:id/identity-verification', admin.setIdentityVerification);

router.get('/plans', admin.listPlansAdmin);
router.post('/plans', admin.createPlan);
router.patch('/plans/:id', admin.updatePlan);

router.get('/servers', admin.listServers);
router.post('/servers', admin.addServer);
router.patch('/servers/:id', admin.updateServer);
router.delete('/servers/:id', admin.removeServer);

router.get('/revenue', admin.revenueSummary);

router.get('/abuse-reports', admin.listAbuseReports);
router.patch('/abuse-reports/:id', admin.updateAbuseReport);

module.exports = router;
