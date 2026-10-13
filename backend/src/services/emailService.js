const nodemailer = require('nodemailer');
const { smtp, appUrl } = require('../config/env');

// Treat missing/placeholder credentials as "not configured" so local dev never
// attempts a real SMTP login (and fails with e.g. "535 Invalid credentials").
const smtpConfigured = Boolean(smtp.host && smtp.user && smtp.pass && smtp.user !== 'xxx' && smtp.pass !== 'xxx');

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465,
      auth: { user: smtp.user, pass: smtp.pass },
    })
  : null;

async function sendMail({ to, subject, html }) {
  if (!smtpConfigured) {
    console.log(`[email:dev] to=${to} subject="${subject}"\n${html}`);
    return;
  }
  await transporter.sendMail({ from: smtp.from, to, subject, html });
}

async function sendVerificationEmail(user, rawToken) {
  const link = `${appUrl}/verify-email?token=${rawToken}&email=${encodeURIComponent(user.email)}`;
  await sendMail({
    to: user.email,
    subject: 'Verify your email',
    html: `<p>Welcome! Please verify your email by clicking <a href="${link}">this link</a>. It expires in 24 hours.</p>`,
  });
}

async function sendPasswordResetEmail(user, rawToken) {
  const link = `${appUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;
  await sendMail({
    to: user.email,
    subject: 'Reset your password',
    html: `<p>Reset your password by clicking <a href="${link}">this link</a>. It expires in 1 hour.</p>`,
  });
}

async function sendAnomalyAlertEmail(toAdminEmail, details) {
  await sendMail({
    to: toAdminEmail,
    subject: `[Alert] Anomalous usage detected for user ${details.userId}`,
    html: `<pre>${JSON.stringify(details, null, 2)}</pre>`,
  });
}

module.exports = { sendMail, sendVerificationEmail, sendPasswordResetEmail, sendAnomalyAlertEmail };
