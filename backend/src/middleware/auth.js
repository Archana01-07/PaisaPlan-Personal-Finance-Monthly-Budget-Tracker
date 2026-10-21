const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

async function requireAuth(req, res, next) {
  try {
    let token = null;

    // Check HttpOnly cookie first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in.',
      });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      // Clear cookie if invalid or expired
      res.clearCookie('token', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
      return res.status(401).json({
        success: false,
        message: 'Session expired or invalid. Please sign in again.',
      });
    }

    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account not found. Please sign in again.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  requireAuth,
};
