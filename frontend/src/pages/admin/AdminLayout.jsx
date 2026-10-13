import React from 'react';
import { Link, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AdminUsers from './AdminUsers';
import AdminServers from './AdminServers';
import AdminPlans from './AdminPlans';
import AdminRevenue from './AdminRevenue';
import AdminAbuseReports from './AdminAbuseReports';

const tabs = [
  { path: 'revenue', label: 'Revenue' },
  { path: 'users', label: 'Users' },
  { path: 'servers', label: 'Servers' },
  { path: 'plans', label: 'Plans' },
  { path: 'abuse-reports', label: 'Abuse Reports' },
];

export default function AdminLayout() {
  const location = useLocation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Admin Panel</h1>
        <p className="text-sm text-slate-500 mt-1">Manage users, servers, plans, and abuse reports.</p>
      </div>
      <div className="flex gap-6 border-b border-slate-200">
        {tabs.map((t) => (
          <Link
            key={t.path}
            to={`/admin/${t.path}`}
            className={`pb-3 text-sm font-medium ${location.pathname.endsWith(t.path) ? 'border-b-2 border-brand-500 text-brand-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {t.label}
          </Link>
        ))}
      </div>
      <Routes>
        <Route index element={<Navigate to="revenue" replace />} />
        <Route path="revenue" element={<AdminRevenue />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="servers" element={<AdminServers />} />
        <Route path="plans" element={<AdminPlans />} />
        <Route path="abuse-reports" element={<AdminAbuseReports />} />
      </Routes>
    </div>
  );
}
