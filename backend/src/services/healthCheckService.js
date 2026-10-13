const net = require('net');
const ProxyServer = require('../models/ProxyServer');

const HEALTH_CHECK_TIMEOUT_MS = 5000;
const MAX_CONSECUTIVE_FAILURES = 3;

function tcpPing(host, port, timeout = HEALTH_CHECK_TIMEOUT_MS) {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();
    let done = false;

    const finish = (ok) => {
      if (done) return;
      done = true;
      socket.destroy();
      resolve({ ok, latencyMs: Date.now() - start });
    };

    socket.setTimeout(timeout);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, host);
  });
}

async function checkServer(server) {
  const { ok, latencyMs } = await tcpPing(server.host, server.ports.http);

  server.lastHealthCheckAt = new Date();
  server.lastHealthOk = ok;
  server.lastLatencyMs = latencyMs;

  if (ok) {
    server.consecutiveFailures = 0;
    if (server.status === 'dead') server.status = 'active';
  } else {
    server.consecutiveFailures += 1;
    if (server.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES && server.status !== 'maintenance') {
      server.status = 'dead';
      console.warn(`[health] server ${server.label} (${server.host}) marked dead after ${server.consecutiveFailures} failures`);
    }
  }

  await server.save();
  return server;
}

async function runHealthChecks() {
  const servers = await ProxyServer.find({ status: { $ne: 'maintenance' } });
  const results = await Promise.allSettled(servers.map(checkServer));
  const failed = results.filter((r) => r.status === 'rejected').length;
  console.log(`[health] checked ${servers.length} servers, ${failed} check errors`);
}

module.exports = { runHealthChecks, checkServer, tcpPing };
