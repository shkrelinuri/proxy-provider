const User = require('../models/User');
const { hashPassword, comparePassword, generateToken, hashToken } = require('../utils/password');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');
const { emailVerificationTtlHours, abuse } = require('../config/env');
const AuditLog = require('../models/AuditLog');

function publicUser(user) {
  return {
    id: user._id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
    isEmailVerified: user.isEmailVerified,
    identityVerification: user.identityVerification,
    createdAt: user.createdAt,
  };
}

async function signup(req, res) {
  const { email, password, fullName, acceptAup } = req.body;

  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
  if (!acceptAup) {
    return res.status(400).json({ error: 'You must accept the Acceptable Use Policy to sign up' });
  }
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const passwordHash = await hashPassword(password);
  const { raw, hash } = generateToken();

  const user = await User.create({
    email: email.toLowerCase(),
    passwordHash,
    fullName,
    aupAcceptedAt: new Date(),
    aupVersion: abuse.aupVersion,
    emailVerificationTokenHash: hash,
    emailVerificationExpires: new Date(Date.now() + emailVerificationTtlHours * 3600 * 1000),
    signupIp: req.ip,
  });

  await sendVerificationEmail(user, raw);
  await AuditLog.create({ actor: user._id, action: 'user.signup', targetType: 'User', targetId: user._id, ip: req.ip });

  res.status(201).json({ message: 'Signup successful, please verify your email.', user: publicUser(user) });
}

async function verifyEmail(req, res) {
  const { email, token } = req.body;
  if (!email || !token) return res.status(400).json({ error: 'email and token are required' });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.emailVerificationTokenHash) return res.status(400).json({ error: 'Invalid or expired token' });

  if (user.emailVerificationExpires < new Date()) {
    return res.status(400).json({ error: 'Verification token expired, please request a new one' });
  }
  if (hashToken(token) !== user.emailVerificationTokenHash) {
    return res.status(400).json({ error: 'Invalid verification token' });
  }

  user.isEmailVerified = true;
  user.status = 'active';
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  res.json({ message: 'Email verified successfully' });
}

async function resendVerification(req, res) {
  const { email } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() });
  if (!user || user.isEmailVerified) {
    return res.json({ message: 'If that account exists, a verification email has been sent.' });
  }
  const { raw, hash } = generateToken();
  user.emailVerificationTokenHash = hash;
  user.emailVerificationExpires = new Date(Date.now() + emailVerificationTtlHours * 3600 * 1000);
  await user.save();
  await sendVerificationEmail(user, raw);
  res.json({ message: 'If that account exists, a verification email has been sent.' });
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return res.status(423).json({ error: 'Account temporarily locked due to repeated failed logins' });
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= 8) {
      user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      user.failedLoginAttempts = 0;
    }
    await user.save();
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (user.status === 'suspended') return res.status(403).json({ error: 'Account suspended' });
  if (user.status === 'banned') return res.status(403).json({ error: 'Account banned' });
  if (!user.isEmailVerified) return res.status(403).json({ error: 'Please verify your email before logging in' });

  user.failedLoginAttempts = 0;
  user.lockedUntil = undefined;
  user.lastLoginAt = new Date();
  user.lastLoginIp = req.ip;
  await user.save();

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  res.json({ accessToken, refreshToken, user: publicUser(user) });
}

async function refresh(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken is required' });

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }

  const user = await User.findById(payload.sub);
  if (!user || user.status === 'suspended' || user.status === 'banned') {
    return res.status(401).json({ error: 'User not found or not permitted' });
  }

  res.json({ accessToken: signAccessToken(user) });
}

async function forgotPassword(req, res) {
  const { email } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() });
  if (user) {
    const { raw, hash } = generateToken();
    user.passwordResetTokenHash = hash;
    user.passwordResetExpires = new Date(Date.now() + 3600 * 1000);
    await user.save();
    await sendPasswordResetEmail(user, raw);
  }
  res.json({ message: 'If that account exists, a reset email has been sent.' });
}

async function resetPassword(req, res) {
  const { email, token, newPassword } = req.body;
  if (!email || !token || !newPassword) {
    return res.status(400).json({ error: 'email, token and newPassword are required' });
  }
  if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.passwordResetTokenHash || user.passwordResetExpires < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired reset token' });
  }
  if (hashToken(token) !== user.passwordResetTokenHash) {
    return res.status(400).json({ error: 'Invalid reset token' });
  }

  user.passwordHash = await hashPassword(newPassword);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({ message: 'Password reset successfully' });
}

async function me(req, res) {
  res.json({ user: publicUser(req.user) });
}

module.exports = {
  signup,
  verifyEmail,
  resendVerification,
  login,
  refresh,
  forgotPassword,
  resetPassword,
  me,
  publicUser,
};
