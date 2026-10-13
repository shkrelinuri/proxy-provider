import React, { useEffect, useState } from 'react';
import client from '../../api/client';

export default function AdminRevenue() {
  const [data, setData] = useState(null);

  useEffect(() => {
    client.get('/api/admin/revenue').then((res) => setData(res.data));
  }, []);

  if (!data) return <p>Loading...</p>;

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <p className="text-sm text-slate-500">Active subscriptions</p>
        <p className="text-3xl font-extrabold">{data.activeSubscriptions}</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <p className="text-sm text-slate-500">Estimated MRR</p>
        <p className="text-3xl font-extrabold">${(data.estimatedMrrCents / 100).toFixed(2)}</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <p className="text-sm text-slate-500">Stripe available balance</p>
        <p className="text-3xl font-bold">
          {data.stripeBalance?.available?.[0]
            ? `$${(data.stripeBalance.available[0].amount / 100).toFixed(2)}`
            : 'N/A'}
        </p>
      </div>
    </div>
  );
}
