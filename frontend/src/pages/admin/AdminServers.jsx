import React, { useEffect, useState } from 'react';
import client from '../../api/client';

const empty = { label: '', host: '', region: '', engine: '3proxy' };

export default function AdminServers() {
  const [servers, setServers] = useState([]);
  const [form, setForm] = useState(empty);

  async function load() {
    const { data } = await client.get('/api/admin/servers');
    setServers(data.servers);
  }

  useEffect(() => {
    load();
  }, []);

  async function addServer() {
    await client.post('/api/admin/servers', form);
    setForm(empty);
    load();
  }

  async function removeServer(id) {
    if (!window.confirm('Remove this server from the pool?')) return;
    await client.delete(`/api/admin/servers/${id}`);
    load();
  }

  async function setMaintenance(id, status) {
    await client.patch(`/api/admin/servers/${id}`, { status });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 grid md:grid-cols-4 gap-2">
        <input
          className="border rounded px-3 py-2"
          placeholder="Label"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Host/IP"
          value={form.host}
          onChange={(e) => setForm({ ...form, host: e.target.value })}
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Region"
          value={form.region}
          onChange={(e) => setForm({ ...form, region: e.target.value })}
        />
        <button onClick={addServer} className="bg-brand-500 hover:bg-brand-600 text-navy-950 font-semibold rounded-lg px-4 py-2">
          Add server
        </button>
      </div>

      <table className="w-full text-sm bg-white rounded-2xl border border-slate-200">
        <thead>
          <tr className="text-left text-slate-500 border-b">
            <th className="p-3">Host</th>
            <th>Region</th>
            <th>Status</th>
            <th>Last check</th>
            <th>Latency</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {servers.map((s) => (
            <tr key={s._id} className="border-b">
              <td className="p-3">{s.host}</td>
              <td>{s.region || '-'}</td>
              <td className={s.status === 'dead' ? 'text-red-600' : s.status === 'active' ? 'text-green-600' : ''}>
                {s.status}
              </td>
              <td>{s.lastHealthCheckAt ? new Date(s.lastHealthCheckAt).toLocaleTimeString() : '-'}</td>
              <td>{s.lastLatencyMs ? `${s.lastLatencyMs}ms` : '-'}</td>
              <td className="space-x-2">
                {s.status !== 'maintenance' ? (
                  <button onClick={() => setMaintenance(s._id, 'maintenance')} className="text-amber-600 text-xs">
                    Maintenance
                  </button>
                ) : (
                  <button onClick={() => setMaintenance(s._id, 'active')} className="text-green-600 text-xs">
                    Reactivate
                  </button>
                )}
                <button onClick={() => removeServer(s._id)} className="text-red-600 text-xs">
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
