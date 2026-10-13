import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/#proxies', label: 'Proxies' },
  { to: '/#pricing', label: 'Pricing' },
  { to: '/#features', label: 'Features' },
  { to: '/aup', label: 'Acceptable Use' },
];

export default function PublicNav() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-navy-950/95 backdrop-blur border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="text-white font-extrabold text-lg tracking-tight">
          Proxy<span className="text-brand-400">Provider</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-slate-300">
          {links.map((l) => (
            <a key={l.to} href={l.to} className="hover:text-white transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <Link to="/dashboard" className="bg-brand-500 hover:bg-brand-600 text-navy-950 font-semibold text-sm px-4 py-2 rounded-lg transition-colors">
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-slate-300 hover:text-white text-sm font-medium">
                Log in
              </Link>
              <Link to="/signup" className="bg-brand-500 hover:bg-brand-600 text-navy-950 font-semibold text-sm px-4 py-2 rounded-lg transition-colors">
                Get started
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden text-slate-300" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="md:hidden px-6 pb-4 flex flex-col gap-3 text-slate-300 text-sm">
          {links.map((l) => (
            <a key={l.to} href={l.to} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <div className="flex gap-3 pt-2">
            {user ? (
              <Link to="/dashboard" className="bg-brand-500 text-navy-950 font-semibold px-4 py-2 rounded-lg">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2">Log in</Link>
                <Link to="/signup" className="bg-brand-500 text-navy-950 font-semibold px-4 py-2 rounded-lg">Get started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
