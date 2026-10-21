const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

const isProduction = process.env.NODE_ENV === 'production';

function sendAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.validatedBody;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
        errors: [{ field: 'email', message: 'Email address is already registered' }],
      });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
    });

    const token = generateToken(user._id);
    sendAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.validatedBody;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please check your credentials.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please check your credentials.',
      });
    }

    const token = generateToken(user._id);
    sendAuthCookie(res, token);

    res.status(200).json({
      success: true,
      message: 'Signed in successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
  });
  return res.status(200).json({
    success: true,
    message: 'Signed out successfully',
  });
}

async function getMe(req, res) {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
    },
  });
}

module.exports = {
  register,
  login,
  logout,
  getMe,
};
