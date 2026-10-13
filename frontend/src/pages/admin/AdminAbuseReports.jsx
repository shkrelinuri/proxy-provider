import React, { useEffect, useState } from 'react';
import client from '../../api/client';

export default function AdminAbuseReports() {
  const [reports, setReports] = useState([]);

  async function load() {
    const { data } = await client.get('/api/admin/abuse-reports');
    setReports(data.reports);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id, status) {
    const resolution = status !== 'open' ? window.prompt('Resolution notes?') || '' : undefined;
    await client.patch(`/api/admin/abuse-reports/${id}`, { status, resolution });
    load();
  }

  return (
    <table className="w-full text-sm bg-white rounded-2xl border border-slate-200">
      <thead>
        <tr className="text-left text-slate-500 border-b">
          <th className="p-3">Category</th>
          <th>Target user</th>
          <th>Description</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {reports.map((r) => (
          <tr key={r._id} className="border-b align-top">
            <td className="p-3">{r.category}</td>
            <td>{r.targetUser?.email || '-'}</td>
            <td className="max-w-xs truncate" title={r.description}>{r.description}</td>
            <td>{r.status}</td>
            <td className="space-x-2">
              <button onClick={() => updateStatus(r._id, 'investigating')} className="text-amber-600 text-xs">Investigate</button>
              <button onClick={() => updateStatus(r._id, 'action_taken')} className="text-red-600 text-xs">Action taken</button>
              <button onClick={() => updateStatus(r._id, 'dismissed')} className="text-slate-500 text-xs">Dismiss</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
