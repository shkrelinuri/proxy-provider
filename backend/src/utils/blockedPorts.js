const { abuse } = require('../config/env');

// Known abuse targets: mail relays (SMTP submission/relay ports) and a small
// default list of frequently-abused destinations. Extend via env/DB as needed.
const DEFAULT_BLOCKED_PORTS = new Set(abuse.blockedPorts.length ? abuse.blockedPorts : [25, 465, 587, 2525]);

function isBlockedPort(port) {
  return DEFAULT_BLOCKED_PORTS.has(Number(port));
}

module.exports = { isBlockedPort, DEFAULT_BLOCKED_PORTS };
