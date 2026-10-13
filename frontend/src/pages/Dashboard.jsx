import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import client from '../api/client';

function bytesToGB(bytes) {
  return (bytes / 1024 / 1024 / 1024).toFixed(2);
}

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-2xl font-extrabold mt-1 ${accent || 'text-slate-900'}`}>{value}</p>
    </div>
  );
}

function Badge({ ok, okText, badText }) {
  return ok ? (
    <span className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 text-xs font-medium px-2 py-1 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-brand-500" /> {okText}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 text-xs font-medium px-2 py-1 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> {badText}
    </span>
  );
}

export default function Dashboard() {
  const [series, setSeries] = useState([]);
  const [quota, setQuota] = useState(null);
  const [credentials, setCredentials] = useState([]);
  const [servers, setServers] = useState([]);
  const [label, setLabel] = useState('');
  const [protocol, setProtocol] = useState('http');
  const [error, setError] = useState('');
  const [newCredential, setNewCredential] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  async function loadAll() {
    const [usageRes, quotaRes, credRes, serverRes] = await Promise.all([
      client.get('/api/usage/daily?days=30'),
      client.get('/api/usage/quota'),
      client.get('/api/proxies/credentials'),
      client.get('/api/proxies/servers'),
    ]);
    setSeries(usageRes.data.series.map((d) => ({ ...d, totalGB: (d.bytesIn + d.bytesOut) / 1024 / 1024 / 1024 })));
    setQuota(quotaRes.data);
    setCredentials(credRes.data.credentials);
    setServers(serverRes.data.servers);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function createCredential() {
    setError('');
    try {
      const { data } = await client.post('/api/proxies/credentials/userpass', { label, protocol });
      setNewCredential(data.credential);
      setLabel('');
      loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create credential');
    }
  }

  async function deleteCredential(id) {
    await client.delete(`/api/proxies/credentials/${id}`);
    loadAll();
  }

  function exportUrl(id, format) {
    const token = localStorage.getItem('accessToken');
    return `${client.defaults.baseURL}/api/proxies/credentials/${id}/export?format=${format}&token=${token}`;
  }

  function copyLine(cred) {
    const server = cred.assignedServer;
    if (!server) return;
    const port = cred.protocol === 'socks5' ? server.ports.socks5 : server.ports.http;
    const line = `${server.host}:${port}:${cred.username}:<see downloaded file>`;
    navigator.clipboard?.writeText(line);
    setCopiedId(cred._id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  const totalRequests = series.reduce((sum, d) => sum + d.requests, 0);
  const totalGB = series.reduce((sum, d) => sum + d.totalGB, 0);
  const quotaPercent = quota?.quotaBytes ? Math.min(100, Math.round((quota.usedBytes / quota.quotaBytes) * 100)) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Monitor usage and manage your proxy credentials.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active credentials" value={credentials.filter((c) => c.isActive).length} />
        <StatCard label="Bandwidth (30d)" value={`${totalGB.toFixed(2)} GB`} accent="text-brand-600" />
        <StatCard label="Requests (30d)" value={totalRequests.toLocaleString()} />
        <StatCard label="Current plan" value={quota?.subscription?.plan || 'None'} />
      </div>

      {quota && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-900">Bandwidth Quota</h2>
            {quota.subscription && <Badge ok={!quota.overQuota} okText="Within quota" badText="Quota exceeded" />}
          </div>
          {quota.subscription ? (
            <>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all ${quotaPercent >= 100 ? 'bg-red-500' : 'bg-brand-500'}`}
                  style={{ width: `${quotaPercent}%` }}
                />
              </div>
              <p className="text-sm text-slate-500 mt-3">
                {bytesToGB(quota.usedBytes)} GB / {bytesToGB(quota.quotaBytes)} GB used this period
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500">
              No active subscription. Visit <span className="text-brand-600 font-medium">Billing &amp; Plans</span> to purchase one.
            </p>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-bold text-slate-900 mb-4">Usage (last 30 days)</h2>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} label={{ value: 'GB', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
            <Tooltip formatter={(v) => `${Number(v).toFixed(3)} GB`} />
            <Line type="monotone" dataKey="totalGB" stroke="#17c982" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-900">Proxy Credentials</h2>
        </div>
        {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-3">{error}</div>}
        {newCredential && (
          <div className="bg-amber-50 text-amber-800 text-sm p-3 rounded-lg mb-3">
            Save these credentials now, the password won't be shown again:
            <div className="font-mono text-xs mt-1">
              {newCredential.ip}:{newCredential.port}:{newCredential.username}:{newCredential.password}
            </div>
          </div>
        )}
        {!quota?.subscription ? (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-4 text-sm text-slate-600 mb-2">
            You need an active plan before you can generate proxies.{' '}
            <Link to="/billing" className="text-brand-600 font-medium">View plans &amp; pay</Link>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mb-5">
            <input
              className="border border-slate-300 rounded-lg px-3 py-2 flex-1 min-w-[160px] text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="Label (e.g. scraper-1)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <select
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              value={protocol}
              onChange={(e) => setProtocol(e.target.value)}
            >
              <option value="http">HTTP/HTTPS</option>
              <option value="socks5">SOCKS5</option>
            </select>
            <button onClick={createCredential} className="bg-brand-500 hover:bg-brand-600 text-navy-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
              + Generate proxy
            </button>
          </div>
        )}
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 px-6 font-medium">Label</th>
                <th className="font-medium">IP : Port</th>
                <th className="font-medium">Protocol</th>
                <th className="font-medium">Username</th>
                <th className="font-medium">Status</th>
                <th className="font-medium">Download</th>
                <th className="px-6"></th>
              </tr>
            </thead>
            <tbody>
              {credentials.map((c) => (
                <tr key={c._id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-6">{c.label || '-'}</td>
                  <td className="font-mono text-xs">
                    {c.assignedServer ? `${c.assignedServer.host}:${c.protocol === 'socks5' ? c.assignedServer.ports.socks5 : c.assignedServer.ports.http}` : '-'}
                  </td>
                  <td className="uppercase text-xs">{c.protocol}</td>
                  <td className="font-mono text-xs">{c.username || '(whitelist)'}</td>
                  <td>
                    <Badge ok={c.isActive} okText="Active" badText={c.disabledReason || 'Disabled'} />
                  </td>
                  <td>
                    <a className="text-brand-600 underline mr-2" href={exportUrl(c._id, 'txt')} target="_blank" rel="noreferrer">.txt</a>
                    <a className="text-brand-600 underline" href={exportUrl(c._id, 'csv')} target="_blank" rel="noreferrer">.csv</a>
                  </td>
                  <td className="px-6 text-right space-x-3 whitespace-nowrap">
                    {c.username && (
                      <button onClick={() => copyLine(c)} className="text-slate-500 hover:text-slate-800 text-xs">
                        {copiedId === c._id ? 'Copied!' : 'Copy'}
                      </button>
                    )}
                    <button onClick={() => deleteCredential(c._id)} className="text-red-600 text-xs">Delete</button>
                  </td>
                </tr>
              ))}
              {credentials.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 px-6 text-center text-slate-400">No proxies yet — generate one above.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-bold text-slate-900 mb-4">Available Proxy Servers</h2>
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 px-6 font-medium">Host</th>
                <th className="font-medium">Region</th>
                <th className="font-medium">HTTP Port</th>
                <th className="font-medium px-6">SOCKS5 Port</th>
              </tr>
            </thead>
            <tbody>
              {servers.map((s) => (
                <tr key={s._id} className="border-b border-slate-100">
                  <td className="py-3 px-6 font-mono text-xs">{s.host}</td>
                  <td>{s.region || '-'}</td>
                  <td>{s.ports?.http}</td>
                  <td className="px-6">{s.ports?.socks5}</td>
                </tr>
              ))}
              {servers.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 px-6 text-center text-slate-400">No active servers in the pool yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
