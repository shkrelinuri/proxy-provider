import React, { useEffect, useState } from 'react';
import client from '../../api/client';

const empty = {
  name: '',
  slug: '',
  type: 'bandwidth',
  bandwidthLimitGB: '',
  portLimit: '',
  priceCents: '',
  billingInterval: 'month',
  requiresIdentityVerification: false,
  paddlePriceId: '',
};

export default function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(empty);

  async function load() {
    const { data } = await client.get('/api/admin/plans');
    setPlans(data.plans);
  }

  useEffect(() => {
    load();
  }, []);

  async function createPlan() {
    await client.post('/api/admin/plans', {
      ...form,
      bandwidthLimitGB: form.bandwidthLimitGB ? Number(form.bandwidthLimitGB) : undefined,
      portLimit: form.portLimit ? Number(form.portLimit) : undefined,
      priceCents: Number(form.priceCents) || 0,
    });
    setForm(empty);
    load();
  }

  async function toggleActive(plan) {
    await client.patch(`/api/admin/plans/${plan._id}`, { isActive: !plan.isActive });
    load();
  }

  async function setPaddlePriceId(plan) {
    const paddlePriceId = window.prompt('Paddle price ID (pri_...)', plan.paddlePriceId || '');
    if (paddlePriceId === null) return;
    await client.patch(`/api/admin/plans/${plan._id}`, { paddlePriceId });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 grid md:grid-cols-3 gap-2">
        <input className="border rounded px-3 py-2" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="border rounded px-3 py-2" placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        <select className="border rounded px-3 py-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="bandwidth">Bandwidth (GB)</option>
          <option value="port">Port/IP</option>
          <option value="pay_per_gb">Pay-per-GB</option>
        </select>
        <input className="border rounded px-3 py-2" placeholder="Bandwidth GB" value={form.bandwidthLimitGB} onChange={(e) => setForm({ ...form, bandwidthLimitGB: e.target.value })} />
        <input className="border rounded px-3 py-2" placeholder="Port limit" value={form.portLimit} onChange={(e) => setForm({ ...form, portLimit: e.target.value })} />
        <input className="border rounded px-3 py-2" placeholder="Price (cents)" value={form.priceCents} onChange={(e) => setForm({ ...form, priceCents: e.target.value })} />
        <input className="border rounded px-3 py-2" placeholder="Paddle price ID (pri_...)" value={form.paddlePriceId} onChange={(e) => setForm({ ...form, paddlePriceId: e.target.value })} />
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input type="checkbox" checked={form.requiresIdentityVerification} onChange={(e) => setForm({ ...form, requiresIdentityVerification: e.target.checked })} />
          Requires identity verification (high-volume plan)
        </label>
        <button onClick={createPlan} className="bg-brand-500 hover:bg-brand-600 text-navy-950 font-semibold rounded-lg px-4 py-2">Create plan</button>
      </div>

      <table className="w-full text-sm bg-white rounded-2xl border border-slate-200">
        <thead>
          <tr className="text-left text-slate-500 border-b">
            <th className="p-3">Name</th>
            <th>Type</th>
            <th>Price</th>
            <th>Paddle price ID</th>
            <th>Active</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {plans.map((p) => (
            <tr key={p._id} className="border-b">
              <td className="p-3">{p.name}</td>
              <td>{p.type}</td>
              <td>${(p.priceCents / 100).toFixed(2)}</td>
              <td className="font-mono text-xs">{p.paddlePriceId || <span className="text-amber-600">not set</span>}</td>
              <td>{p.isActive ? 'yes' : 'no'}</td>
              <td className="space-x-2">
                <button onClick={() => setPaddlePriceId(p)} className="text-brand-600 text-xs">
                  Set Paddle ID
                </button>
                <button onClick={() => toggleActive(p)} className="text-brand-600 text-xs">
                  {p.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
