import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import client from '../api/client';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const email = params.get('email');
    const token = params.get('token');
    if (!email || !token) {
      setStatus('error');
      setMessage('Missing verification parameters');
      return;
    }
    client
      .post('/api/auth/verify-email', { email, token })
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification failed');
      });
  }, [params]);

  return (
    <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl border border-slate-200 text-center">
      {status === 'verifying' && <p>Verifying your email...</p>}
      {status === 'success' && (
        <>
          <p className="text-brand-600 font-medium mb-4">Your email has been verified!</p>
          <Link to="/login" className="text-brand-600 underline">Log in</Link>
        </>
      )}
      {status === 'error' && <p className="text-red-700">{message}</p>}
    </div>
  );
}
