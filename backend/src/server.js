const app = require('./app');
const connectDB = require('./config/db');
const { port } = require('./config/env');
const { startHealthCheckJob } = require('./jobs/healthCheckJob');
const { startQuotaEnforcerJob } = require('./jobs/quotaEnforcerJob');

async function main() {
  await connectDB();

  app.listen(port, () => {
    console.log(`[server] listening on port ${port}`);
  });

  startHealthCheckJob();
  startQuotaEnforcerJob();
}

main().catch((err) => {
  console.error('[server] failed to start', err);
  process.exit(1);
});
