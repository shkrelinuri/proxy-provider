import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { openPaddleCheckout } from '../api/paddle';

const typeLabels = { bandwidth: 'Bandwidth', port: 'Dedicated Port', pay_per_gb: 'Pay-per-GB' };

export default function Billing() {
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [error, setError] = useState('');

  function loadSubscriptions() {
    client.get('/api/billing/subscriptions').then((res) => setSubscriptions(res.data.subscriptions));
  }

  useEffect(() => {
    client.get('/api/billing/plans').then((res) => setPlans(res.data.plans));
    loadSubscriptions();
  }, []);

  async function checkout(planId) {
    setError('');
    try {
      const { data } = await client.post('/api/billing/checkout', { planId });
      openPaddleCheckout({
        priceId: data.priceId,
        email: data.email,
        customData: data.customData,
        // Webhooks land async; re-fetch after a short delay so the new plan shows up.
        onComplete: () => setTimeout(loadSubscriptions, 2000),
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Checkout failed');
    }
  }

  async function openPortal() {
    try {
      const { data } = await client.post('/api/billing/portal');
      window.open(data.url, '_blank', 'noopener');
    } catch (err) {
      setError(err.response?.data?.error || 'No billing history yet — purchase a plan first.');
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Billing &amp; Plans</h1>
        <p className="text-sm text-slate-500 mt-1">Choose a bandwidth, dedicated-port, or pay-per-GB plan.</p>
      </div>
      {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-slate-900">Your subscriptions</h2>
          <button onClick={openPortal} className="text-brand-600 font-medium text-sm hover:underline">
            Manage billing / invoices
          </button>
        </div>
        <ul className="text-sm divide-y divide-slate-100">
          {subscriptions.map((s) => (
            <li key={s._id} className="py-2 flex items-center justify-between">
              <span className="font-medium text-slate-700">{s.plan?.name}</span>
              <span className="text-slate-500">
                {s.status}
                {s.currentPeriodEnd && ` · renews ${new Date(s.currentPeriodEnd).toLocaleDateString()}`}
              </span>
            </li>
          ))}
          {subscriptions.length === 0 && <li className="py-2 text-slate-400">No subscriptions yet</li>}
        </ul>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {plans.map((plan) => (
          <div key={plan._id} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col hover:border-brand-300 hover:shadow-card transition-all">
            <span className="inline-block w-fit bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full mb-3">
              {typeLabels[plan.type] || plan.type}
            </span>
            <h3 className="font-bold text-slate-900">{plan.name}</h3>
            <p className="text-3xl font-extrabold text-slate-900 my-3">
              ${(plan.priceCents / 100).toFixed(2)}
              <span className="text-sm font-normal text-slate-500">/{plan.billingInterval}</span>
            </p>
            <ul className="text-sm text-slate-600 mb-6 space-y-2 flex-1">
              {plan.bandwidthLimitGB && (
                <li className="flex items-center gap-2"><span className="text-brand-500">✓</span> {plan.bandwidthLimitGB} GB bandwidth included</li>
              )}
              {plan.portLimit && (
                <li className="flex items-center gap-2"><span className="text-brand-500">✓</span> {plan.portLimit} dedicated ports/IPs</li>
              )}
              {plan.pricePerGBCents && (
                <li className="flex items-center gap-2"><span className="text-brand-500">✓</span> ${(plan.pricePerGBCents / 100).toFixed(2)} / GB metered</li>
              )}
              <li className="flex items-center gap-2"><span className="text-brand-500">✓</span> {plan.concurrentConnectionLimit} concurrent connections</li>
              {plan.requiresIdentityVerification && (
                <li className="flex items-center gap-2 text-amber-600"><span>⚠</span> Requires identity verification</li>
              )}
            </ul>
            <button
              onClick={() => checkout(plan._id)}
              className="w-full bg-brand-500 hover:bg-brand-600 text-navy-950 font-semibold py-2.5 rounded-lg transition-colors"
            >
              Subscribe
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
