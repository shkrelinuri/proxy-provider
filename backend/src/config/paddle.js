const { Paddle, Environment } = require('@paddle/paddle-node-sdk');
const { paddle } = require('./env');

if (!paddle.apiKey) {
  console.warn('[paddle] PADDLE_API_KEY not set, billing routes will fail');
}

module.exports = new Paddle(paddle.apiKey || 'missing_key', {
  environment: paddle.environment === 'production' ? Environment.production : Environment.sandbox,
});
