import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import AuthLayout from '../components/AuthLayout';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await client.post('/api/auth/forgot-password', { email });
      setMessage(data.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Forgot your password?" subtitle="We'll email you a link to reset it">
      {message ? (
        <div className="bg-brand-50 text-brand-700 text-sm p-3 rounded-lg mt-4">{message}</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button
            disabled={submitting}
            className="w-full bg-brand-500 hover:bg-brand-600 text-navy-950 font-semibold py-2.5 rounded-lg disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      )}
      <p className="text-sm text-slate-500 mt-5 text-center">
        <Link to="/login" className="text-brand-600 font-medium">Back to log in</Link>
      </p>
    </AuthLayout>
  );
}
