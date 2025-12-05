const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../config/jwt');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// @desc Register new user
// @route POST /api/auth/register
// @access Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide name, email and password');
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({ name, email, password });

  const accessToken = signAccessToken({ id: user._id });
  const refreshToken = signRefreshToken({ id: user._id });

  // store refresh token in DB
  user.refreshTokens.push({ token: refreshToken });
  await user.save();

  res.status(201).json({
    user: { id: user._id, name: user.name, email: user.email },
    accessToken,
    refreshToken,
  });
});

// @desc Login user
// @route POST /api/auth/login
// @access Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  const accessToken = signAccessToken({ id: user._id });
  const refreshToken = signRefreshToken({ id: user._id });

  user.refreshTokens.push({ token: refreshToken });
  await user.save();

  res.json({
    user: { id: user._id, name: user.name, email: user.email },
    accessToken,
    refreshToken,
  });
});

// @desc Refresh access token
// @route POST /api/auth/refresh-token
// @access Public (requires refresh token)
const refreshToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) {
    res.status(400);
    throw new Error('Refresh token is required');
  }

  try {
    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.id);
    if (!user) {
      res.status(401);
      throw new Error('User not found');
    }

    // check that this refresh token exists in DB
    const tokenFound = user.refreshTokens.find((t) => t.token === token);
    if (!tokenFound) {
      res.status(401);
      throw new Error('Refresh token revoked');
    }

    // issue new access token (and optionally a new refresh token)
    const accessToken = signAccessToken({ id: user._id });
    return res.json({ accessToken });
  } catch (err) {
    res.status(401);
    throw new Error('Invalid refresh token');
  }
});

// @desc Logout user (revoke refresh token)
// @route POST /api/auth/logout
// @access Public (requires refresh token)
const logout = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) {
    res.status(400);
    throw new Error('Refresh token is required');
  }

  try {
    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(200).json({ message: 'Logged out' });
    }

    // remove this refresh token from DB
    user.refreshTokens = user.refreshTokens.filter((t) => t.token !== token);
    await user.save();

    res.json({ message: 'Logged out' });
  } catch (err) {
    // still try to return success to avoid leaking info
    res.status(200).json({ message: 'Logged out' });
  }
});

// @desc Forgot password (send reset link)
// @route POST /api/auth/forgot-password
// @access Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const user = await User.findOne({ email });
  if (!user) {
    // don't reveal whether user exists
    return res.json({ message: 'If that email exists, a reset link was sent' });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashed = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.resetPasswordToken = hashed;
  user.resetPasswordExpires = Date.now() + 1000 * 60 * 60; // 1 hour
  await user.save();

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  const message = `You requested a password reset. Click: ${resetUrl}\nIf you didn't request, ignore.`;

  try {
    await sendEmail({ to: user.email, subject: 'TaskFlow Password Reset', text: message });
    res.json({ message: 'If that email exists, a reset link was sent' });
  } catch (error) {
    // cleanup
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.status(500);
    throw new Error('Email could not be sent');
  }
});

// @desc Reset password
// @route POST /api/auth/reset-password/:resetToken
// @access Public
const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { password } = req.body;

  const hashed = crypto.createHash('sha256').update(resetToken).digest('hex');
  const user = await User.findOne({ resetPasswordToken: hashed, resetPasswordExpires: { $gt: Date.now() } });
  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired token');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  // clear refresh tokens to force re-login
  user.refreshTokens = [];
  await user.save();

  res.json({ message: 'Password reset successful' });
});

module.exports = { register, login, refreshToken, logout, forgotPassword, resetPassword };