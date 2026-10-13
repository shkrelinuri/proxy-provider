const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  // Also accept ?token= for direct-link file downloads (e.g. proxy list export links).
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.query.token || null;
  if (!token) return res.status(401).json({ error: 'Missing access token' });

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const user = await User.findById(payload.sub);
  if (!user) return res.status(401).json({ error: 'User not found' });
  if (user.status === 'suspended') return res.status(403).json({ error: 'Account suspended' });
  if (user.status === 'banned') return res.status(403).json({ error: 'Account banned' });

  req.user = user;
  next();
}

module.exports = requireAuth;
