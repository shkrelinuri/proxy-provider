import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import client from '../api/client';
import AuthLayout from '../components/AuthLayout';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const email = params.get('email');
  const token = params.get('token');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data } = await client.post('/api/auth/reset-password', { email, token, newPassword });
      setMessage(data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (!email || !token) {
    return (
      <AuthLayout title="Reset password" subtitle="Invalid or missing reset link">
        <p className="text-sm text-slate-500 mt-4">
          Request a new link from the{' '}
          <Link to="/forgot-password" className="text-brand-600 font-medium">forgot password</Link> page.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set a new password" subtitle={`For ${email}`}>
      {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4">{error}</div>}
      {message ? (
        <div className="bg-brand-50 text-brand-700 text-sm p-3 rounded-lg mt-4">{message}</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New password</label>
            <input
              type="password"
              required
              minLength={8}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <button
            disabled={submitting}
            className="w-full bg-brand-500 hover:bg-brand-600 text-navy-950 font-semibold py-2.5 rounded-lg disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Resetting...' : 'Reset password'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
