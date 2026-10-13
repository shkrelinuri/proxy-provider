import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-navy-950 border-t border-white/5 text-slate-400">
      <div className="max-w-7xl mx-auto px-6 py-12 grid gap-8 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <p className="text-white font-extrabold text-lg mb-2">
            Proxy<span className="text-brand-400">Provider</span>
          </p>
          <p className="text-sm">Fast, reliable datacenter proxies for scraping, automation, and market research.</p>
        </div>
        <div>
          <p className="text-white font-semibold text-sm mb-3">Product</p>
          <ul className="space-y-2 text-sm">
            <li><a href="/#pricing" className="hover:text-white">Pricing</a></li>
            <li><a href="/#proxies" className="hover:text-white">Proxy types</a></li>
            <li><a href="/#features" className="hover:text-white">Features</a></li>
          </ul>
        </div>
        <div>
          <p className="text-white font-semibold text-sm mb-3">Company</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/aup" className="hover:text-white">Acceptable Use Policy</Link></li>
            <li><a href="mailto:abuse@proxyprovider.com" className="hover:text-white">Report abuse</a></li>
          </ul>
        </div>
        <div>
          <p className="text-white font-semibold text-sm mb-3">Account</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/login" className="hover:text-white">Log in</Link></li>
            <li><Link to="/signup" className="hover:text-white">Sign up</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 py-6 text-center text-xs">
        © {new Date().getFullYear()} ProxyProvider. All rights reserved.
      </div>
    </footer>
  );
}
