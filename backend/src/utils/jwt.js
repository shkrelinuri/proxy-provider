const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/env');

function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, status: user.status },
    jwtConfig.accessSecret,
    { expiresIn: jwtConfig.accessTtl }
  );
}

function signRefreshToken(user) {
  return jwt.sign({ sub: user._id.toString(), type: 'refresh' }, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshTtl,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, jwtConfig.accessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, jwtConfig.refreshSecret);
}

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };
