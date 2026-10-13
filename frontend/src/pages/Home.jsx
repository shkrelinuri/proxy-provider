import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const proxyTypes = [
  { name: 'Datacenter Proxies', desc: 'High-speed IPv4 proxies for scraping, SEO monitoring, and automation.', icon: '🖥️' },
  { name: 'HTTP/HTTPS', desc: 'Standard web-protocol proxies compatible with any HTTP client or browser extension.', icon: '🌐' },
  { name: 'SOCKS5', desc: 'Low-level TCP proxies for apps, bots, and non-HTTP traffic.', icon: '🔌' },
];

const features = [
  { title: 'Instant activation', desc: 'Credentials are generated the moment your payment clears — no waiting.' },
  { title: 'Usage dashboard', desc: 'Real-time bandwidth & request charts so you always know where you stand.' },
  { title: '99.9% uptime pool', desc: 'Automated health checks every minute silently route around dead nodes.' },
  { title: 'REST API', desc: 'Manage proxies, credentials, and usage programmatically with scoped API keys.' },
  { title: 'Flexible billing', desc: 'Pay by bandwidth, by dedicated port, or metered per GB via Stripe.' },
  { title: 'Abuse-resistant', desc: 'Blocked abuse ports, anomaly alerts, and instant suspension keep the pool clean.' },
];

const stats = [
  { value: '10K+', label: 'Datacenter IPs' },
  { value: '30+', label: 'Locations' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '<50ms', label: 'Avg. latency' },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div>
      <section className="relative overflow-hidden bg-navy-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,rgba(23,201,130,0.18),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.15),transparent_45%)]" />
        <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
          <span className="inline-flex items-center gap-2 bg-white/5 text-brand-400 text-xs font-semibold px-3 py-1 rounded-full mb-6">
            Trusted datacenter proxy infrastructure
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Fast, reliable proxies <br className="hidden sm:block" />
            for <span className="text-brand-400">scraping &amp; automation</span>
          </h1>
          <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto">
            HTTP/HTTPS and SOCKS5 datacenter proxies with bandwidth or dedicated-port plans. Buy in minutes,
            manage everything from one dashboard.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              to={user ? '/dashboard' : '/signup'}
              className="bg-brand-500 hover:bg-brand-600 text-navy-950 font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              {user ? 'Go to dashboard' : 'Get started free'}
            </Link>
            <a href="#pricing" className="text-slate-200 hover:text-white font-medium px-6 py-3 border border-white/10 rounded-lg">
              View pricing
            </a>
          </div>

          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-2xl sm:text-3xl font-extrabold text-white">{s.value}</p>
                <p className="text-sm text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="proxies" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-extrabold text-slate-900 text-center">Choose your proxy type</h2>
          <p className="text-slate-500 text-center mt-2">Every plan supports all three protocols out of the box.</p>
          <div className="mt-12 grid sm:grid-cols-3 gap-6">
            {proxyTypes.map((p) => (
              <div key={p.name} className="rounded-2xl border border-slate-200 p-6 hover:shadow-card transition-shadow">
                <div className="text-3xl mb-4">{p.icon}</div>
                <h3 className="font-bold text-slate-900">{p.name}</h3>
                <p className="text-sm text-slate-500 mt-2">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-extrabold text-slate-900 text-center">Everything you need, built in</h2>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-4 font-bold">✓</div>
                <h3 className="font-bold text-slate-900">{f.title}</h3>
                <p className="text-sm text-slate-500 mt-2">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-navy-950 py-20 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-extrabold text-white">Ready to see pricing?</h2>
          <p className="text-slate-400 mt-3">Bandwidth, dedicated-port, and pay-per-GB plans — pick what fits your workload.</p>
          <Link
            to={user ? '/billing' : '/signup'}
            className="mt-8 inline-block bg-brand-500 hover:bg-brand-600 text-navy-950 font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            {user ? 'View plans' : 'Create a free account'}
          </Link>
        </div>
      </section>
    </div>
  );
}
