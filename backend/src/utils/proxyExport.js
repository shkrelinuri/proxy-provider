// Formats proxy credentials/servers into exportable proxy list strings.

function toProxyLines(credential, servers) {
  const lines = [];

  for (const server of servers) {
    const port = credential.protocol === 'socks5' ? server.ports.socks5 : server.ports.http;

    if (credential.authType === 'ip_whitelist') {
      // No user/pass needed; whitelist auth relies on source IP.
      lines.push(`${server.host}:${port}`);
      continue;
    }

    const user = credential.username;
    const pass = credential._plainPassword || '<password-hidden>';
    lines.push(`${server.host}:${port}:${user}:${pass}`);
  }

  return lines;
}

function toCsv(credential, servers) {
  const header = 'host,port,protocol,username,password';
  const rows = [header];
  for (const server of servers) {
    const port = credential.protocol === 'socks5' ? server.ports.socks5 : server.ports.http;
    const pass = credential.authType === 'userpass' ? credential._plainPassword || '<password-hidden>' : '';
    rows.push(`${server.host},${port},${credential.protocol},${credential.username || ''},${pass}`);
  }
  return rows.join('\n');
}

module.exports = { toProxyLines, toCsv };
