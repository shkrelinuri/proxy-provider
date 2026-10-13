const cron = require('node-cron');
const { runHealthChecks } = require('../services/healthCheckService');

function startHealthCheckJob() {
  // Every minute, as required.
  cron.schedule('* * * * *', async () => {
    try {
      await runHealthChecks();
    } catch (err) {
      console.error('[healthCheckJob] error', err);
    }
  });
  console.log('[healthCheckJob] scheduled every minute');
}

module.exports = { startHealthCheckJob };
