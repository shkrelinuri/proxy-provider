import React from 'react';

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      <div className="hidden lg:flex lg:w-1/2 bg-navy-950 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(23,201,130,0.2),transparent_50%)]" />
        <div className="relative max-w-md">
          <p className="text-brand-400 font-semibold text-sm mb-4">DATACENTER PROXY PLATFORM</p>
          <h2 className="text-3xl font-extrabold text-white leading-tight">
            Reliable HTTP/HTTPS &amp; SOCKS5 proxies, managed from one dashboard.
          </h2>
          <ul className="mt-8 space-y-3 text-slate-400 text-sm">
            <li className="flex items-center gap-2"><span className="text-brand-400">✓</span> Real-time usage &amp; quota tracking</li>
            <li className="flex items-center gap-2"><span className="text-brand-400">✓</span> Instant credential generation</li>
            <li className="flex items-center gap-2"><span className="text-brand-400">✓</span> Programmatic access via REST API</li>
          </ul>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-card border border-slate-200">
          <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-1 mb-2">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
