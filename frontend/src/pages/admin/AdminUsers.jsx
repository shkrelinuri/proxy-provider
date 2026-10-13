import React, { useEffect, useState } from 'react';
import client from '../../api/client';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');

  async function load() {
    const { data } = await client.get('/api/admin/users', { params: { q } });
    setUsers(data.users);
  }

  useEffect(() => {
    load();
  }, []);

  async function suspend(id) {
    const reason = window.prompt('Suspension reason?') || 'Suspended by admin';
    await client.post(`/api/admin/users/${id}/suspend`, { reason });
    load();
  }

  async function reactivate(id) {
    await client.post(`/api/admin/users/${id}/reactivate`);
    load();
  }

  async function setVerification(id, status) {
    await client.post(`/api/admin/users/${id}/identity-verification`, { status });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          className="border rounded px-3 py-2 flex-1"
          placeholder="Search by email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
        />
        <button onClick={load} className="bg-slate-700 text-white px-4 py-2 rounded">
          Search
        </button>
      </div>
      <table className="w-full text-sm bg-white rounded-2xl border border-slate-200">
        <thead>
          <tr className="text-left text-slate-500 border-b">
            <th className="p-3">Email</th>
            <th>Status</th>
            <th>Identity</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id} className="border-b">
              <td className="p-3">{u.email}</td>
              <td>{u.status}</td>
              <td>{u.identityVerification?.status}</td>
              <td className="space-x-2">
                {u.status === 'suspended' ? (
                  <button onClick={() => reactivate(u._id)} className="text-green-600 text-xs">
                    Reactivate
                  </button>
                ) : (
                  <button onClick={() => suspend(u._id)} className="text-red-600 text-xs">
                    Suspend
                  </button>
                )}
                <button onClick={() => setVerification(u._id, 'approved')} className="text-brand-600 text-xs">
                  Approve ID
                </button>
                <button onClick={() => setVerification(u._id, 'rejected')} className="text-slate-500 text-xs">
                  Reject ID
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
