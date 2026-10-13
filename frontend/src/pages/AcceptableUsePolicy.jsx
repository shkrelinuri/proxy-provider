import React from 'react';

export default function AcceptableUsePolicy() {
  return (
    <div className="max-w-3xl mx-auto my-16 bg-white p-8 rounded-2xl border border-slate-200 prose">
      <h1>Acceptable Use Policy</h1>
      <p>By using our proxy services you agree that you will NOT use the service to:</p>
      <ul>
        <li>Send unsolicited bulk email (spam) or engage in email/account phishing</li>
        <li>Commit fraud, including payment fraud, ad fraud, or credential stuffing</li>
        <li>Create accounts in bulk or automate signups to evade rate limits or bans (account-creation abuse)</li>
        <li>Engage in any illegal activity under applicable law</li>
        <li>Relay traffic through blocked ports (e.g. SMTP mail relaying)</li>
        <li>Attack, scan, or exploit third-party systems without authorization</li>
      </ul>
      <p>
        We monitor connection metadata for abuse detection, retain logs as required by law, and may
        instantly suspend accounts found in violation. High-volume plans require identity/payment
        verification prior to activation.
      </p>
    </div>
  );
}
