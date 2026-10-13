import React, { useEffect, useState } from 'react';
import client from '../api/client';

export default function ApiKeys() {
  const [keys, setKeys] = useState([]);
  const [name, setName] = useState('');
  const [created, setCreated] = useState(null);

  async function load() {
    const { data } = await client.get('/api/api-keys');
    setKeys(data.apiKeys);
  }

  useEffect(() => {
    load();
  }, []);

  async function createKey() {
    const { data } = await client.post('/api/api-keys', { name, scopes: ['proxies:read', 'proxies:write', 'usage:read'] });
    setCreated(data.apiKey);
    setName('');
    load();
  }

  async function revoke(id) {
    await client.delete(`/api/api-keys/${id}`);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">API Keys</h1>
        <p className="text-sm text-slate-500 mt-1">
          Use API keys with the public REST API at <code className="bg-slate-100 px-1.5 py-0.5 rounded">/api/v1/*</code> to manage proxies programmatically.
        </p>
      </div>

      {created && (
        <div className="bg-amber-50 text-amber-800 text-sm p-3 rounded-lg">
          Copy this key now, it won't be shown again: <b>{created.key}</b>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex gap-2 mb-5">
          <input
            className="border border-slate-300 rounded-lg px-3 py-2 flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            placeholder="Key name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button onClick={createKey} className="bg-brand-500 hover:bg-brand-600 text-navy-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
            Create key
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="py-2 font-medium">Name</th>
              <th className="font-medium">Prefix</th>
              <th className="font-medium">Scopes</th>
              <th className="font-medium">Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k._id} className="border-b border-slate-100">
                <td className="py-3">{k.name}</td>
                <td className="font-mono text-xs">{k.keyPrefix}...</td>
                <td>{k.scopes.join(', ')}</td>
                <td>{k.isActive ? 'active' : 'revoked'}</td>
                <td>
                  {k.isActive && (
                    <button onClick={() => revoke(k._id)} className="text-red-600 text-xs">
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
