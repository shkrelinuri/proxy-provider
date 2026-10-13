require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const proxyRoutes = require('./routes/proxyRoutes');
const billingRoutes = require('./routes/billingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const usageRoutes = require('./routes/usageRoutes');
const publicApiRoutes = require('./routes/publicApiRoutes');
const internalRoutes = require('./routes/internalRoutes');
const apiKeyRoutes = require('./routes/apiKeyRoutes');
const abuseRoutes = require('./routes/abuseRoutes');
const paddleWebhook = require('./webhooks/paddleWebhook');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Paddle webhook needs the raw body for signature verification, must be registered before express.json()
app.post('/webhooks/paddle', express.raw({ type: 'application/json' }), paddleWebhook);

app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/proxies', proxyRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/abuse-reports', abuseRoutes);
app.use('/api/v1', publicApiRoutes); // public REST API (API-key authenticated)
app.use('/internal', internalRoutes); // proxy-server auth callouts, not public

app.use(notFound);
app.use(errorHandler);

module.exports = app;
