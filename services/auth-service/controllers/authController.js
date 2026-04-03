import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import User from '../models/User.js';
import { AppError } from '../utils/errors.js';

// In-memory store for QR login sessions (use Redis in production)
const qrLoginSessions = new Map();

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, email: user.email, role: user.role, jti: uuidv4() }, 
    process.env.JWT_SECRET, 
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { id: user._id, jti: uuidv4() }, 
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, 
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

const signup = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return next(new AppError('User already exists', 400));

    const user = new User({ email, password });
    
    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshTokens = [refreshToken];
    await user.save();

    res.cookie('refreshToken', refreshToken, cookieOptions);

    res.status(201).json({ 
      status: 'success',
      token: accessToken, 
      userId: user._id,
      correlationId: req.correlationId 
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return next(new AppError('Invalid credentials', 401));
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return next(new AppError('Account is locked due to too many failed attempts. Please try again later.', 401));
    }

    if (!(await user.comparePassword(password))) {
      // Increment login attempts
      user.loginAttempts += 1;
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = Date.now() + LOCK_TIME;
      }
      await user.save();
      return next(new AppError('Invalid credentials', 401));
    }

    // Reset login attempts on success
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      const tempToken = jwt.sign(
        { id: user._id, type: '2fa_verification' },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );
      
      return res.status(200).json({
        status: '2fa_required',
        tempToken,
        correlationId: req.correlationId
      });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    
    // Clear old tokens (or implement limited session management)
    user.refreshTokens.push(refreshToken);
    // Keep only last 5 tokens for multiple devices
    if (user.refreshTokens.length > 5) {
      user.refreshTokens.shift();
    }
    await user.save();

    res.cookie('refreshToken', refreshToken, cookieOptions);

    res.status(200).json({ 
      status: 'success',
      token: accessToken, 
      userId: user._id,
      correlationId: req.correlationId
    });
  } catch (err) {
    next(err);
  }
};

const setup2FA = async (req, res, next) => {
  try {
    const user = req.user;
    if (user.twoFactorEnabled) {
      return next(new AppError('2FA is already enabled', 400));
    }

    const secret = speakeasy.generateSecret({
      name: `SuperApp (${user.email})`
    });

    user.twoFactorSecret = secret.base32;
    await user.save();

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    res.status(200).json({
      status: 'success',
      qrCode: qrCodeUrl,
      secret: secret.base32,
      correlationId: req.correlationId
    });
  } catch (err) {
    next(err);
  }
};

const verify2FA = async (req, res, next) => {
  try {
    const { token } = req.body;
    const user = req.user;

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token
    });

    if (!verified) {
      return next(new AppError('Invalid 2FA token', 400));
    }

    user.twoFactorEnabled = true;
    // Generate recovery codes
    const recoveryCodes = Array.from({ length: 10 }, () => uuidv4().split('-')[0]);
    user.twoFactorRecoveryCodes = recoveryCodes;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: '2FA enabled successfully',
      recoveryCodes,
      correlationId: req.correlationId
    });
  } catch (err) {
    next(err);
  }
};

const disable2FA = async (req, res, next) => {
  try {
    const { token } = req.body;
    const user = req.user;

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token
    });

    if (!verified) {
      return next(new AppError('Invalid 2FA token', 400));
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorRecoveryCodes = [];
    await user.save();

    res.status(200).json({
      status: 'success',
      message: '2FA disabled successfully',
      correlationId: req.correlationId
    });
  } catch (err) {
    next(err);
  }
};

const loginVerify2FA = async (req, res, next) => {
  try {
    const { token, tempToken } = req.body;
    
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    if (decoded.type !== '2fa_verification') {
      return next(new AppError('Invalid temporary token', 401));
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token
    });

    if (!verified) {
      // Check recovery codes
      const recoveryIndex = user.twoFactorRecoveryCodes.indexOf(token);
      if (recoveryIndex !== -1) {
        // Remove used recovery code
        user.twoFactorRecoveryCodes.splice(recoveryIndex, 1);
        await user.save();
      } else {
        return next(new AppError('Invalid 2FA token or recovery code', 400));
      }
    }

    const { accessToken, refreshToken } = generateTokens(user);
    
    user.refreshTokens.push(refreshToken);
    if (user.refreshTokens.length > 5) {
      user.refreshTokens.shift();
    }
    await user.save();

    res.cookie('refreshToken', refreshToken, cookieOptions);

    res.status(200).json({ 
      status: 'success',
      token: accessToken, 
      userId: user._id,
      correlationId: req.correlationId
    });
  } catch (err) {
    next(err);
  }
};

const status2FA = async (req, res, next) => {
  try {
    res.status(200).json({
      status: 'success',
      enabled: req.user.twoFactorEnabled,
      type: req.user.twoFactorType,
      correlationId: req.correlationId
    });
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.refreshToken) return next(new AppError('No refresh token provided', 401));
    const oldRefreshToken = cookies.refreshToken;

    const user = await User.findOne({ refreshTokens: oldRefreshToken });

    // REUSE DETECTION
    if (!user) {
      try {
        const decoded = jwt.verify(
          oldRefreshToken, 
          process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
        );
        // If token is valid but NOT found in DB, it might have been stolen and used!
        // Clear all tokens for the user to be safe.
        const hackedUser = await User.findById(decoded.id);
        if (hackedUser) {
          hackedUser.refreshTokens = [];
          await hackedUser.save();
        }
      } catch (err) {
        // Token invalid or expired, no action needed for reuse detection
      }
      return next(new AppError('Invalid or reused refresh token', 403));
    }

    // REMOVE OLD TOKEN
    const newRefreshTokens = user.refreshTokens.filter(rt => rt !== oldRefreshToken);

    // VERIFY TOKEN
    jwt.verify(
      oldRefreshToken, 
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      async (err, decoded) => {
        if (err || user._id.toString() !== decoded.id) {
          user.refreshTokens = newRefreshTokens;
          await user.save();
          return next(new AppError('Token expired or invalid', 403));
        }

        // Generate new tokens
        const { accessToken, refreshToken } = generateTokens(user);
        
        user.refreshTokens = [...newRefreshTokens, refreshToken];
        await user.save();

        res.cookie('refreshToken', refreshToken, cookieOptions);

        res.status(200).json({ 
          status: 'success',
          token: accessToken,
          correlationId: req.correlationId
        });
      }
    );
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.refreshToken) return res.sendStatus(204);
    const refreshToken = cookies.refreshToken;

    const user = await User.findOne({ refreshTokens: refreshToken });
    if (user) {
      user.refreshTokens = user.refreshTokens.filter(rt => rt !== refreshToken);
      await user.save();
    }

    res.clearCookie('refreshToken', { 
      ...cookieOptions,
      maxAge: 0
    });
    res.status(200).json({ status: 'success', message: 'Logged out' });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// QR-BASED LOGIN (WeChat-style scan-to-login)
// ==========================================

/**
 * Step 1 (Web): Generate a QR token + QR image
 * The web browser polls /qr-login/status/:token until the mobile app scans it.
 */
const generateQRLogin = async (req, res, next) => {
  try {
    const token = uuidv4();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    qrLoginSessions.set(token, { status: 'pending', userId: null, expiresAt });

    // Encode the token into a QR image
    const qrPayload = JSON.stringify({ action: 'qr_login', token });
    const qrImageDataUrl = await qrcode.toDataURL(qrPayload);

    res.status(200).json({
      status: 'success',
      qrToken: token,
      qrImage: qrImageDataUrl,
      expiresIn: 300,
      correlationId: req.correlationId
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Step 2 (Mobile): Authenticated mobile user scans the QR and confirms login
 */
const confirmQRLogin = async (req, res, next) => {
  try {
    const { qrToken } = req.body;
    const userId = req.headers['x-user-id'] || req.user?.id;

    if (!qrToken || !userId) {
      return next(new AppError('qrToken and authenticated user are required', 400));
    }

    const session = qrLoginSessions.get(qrToken);
    if (!session) return next(new AppError('QR token not found', 404));
    if (session.expiresAt < Date.now()) {
      qrLoginSessions.delete(qrToken);
      return next(new AppError('QR token has expired', 410));
    }
    if (session.status !== 'pending') {
      return next(new AppError('QR token already used', 400));
    }

    // Mark as scanned – the web polling endpoint will pick this up
    qrLoginSessions.set(qrToken, { ...session, status: 'scanned', userId });

    res.status(200).json({ status: 'success', message: 'QR login confirmed', correlationId: req.correlationId });
  } catch (err) {
    next(err);
  }
};

/**
 * Step 3 (Web): Poll the status of the QR login token
 * Returns a full JWT pair once the mobile user has confirmed.
 */
const pollQRLogin = async (req, res, next) => {
  try {
    const { token } = req.params;
    const session = qrLoginSessions.get(token);

    if (!session) return next(new AppError('QR token not found', 404));
    if (session.expiresAt < Date.now()) {
      qrLoginSessions.delete(token);
      return next(new AppError('QR token has expired', 410));
    }

    if (session.status === 'pending') {
      return res.status(200).json({ status: 'pending', correlationId: req.correlationId });
    }

    if (session.status === 'scanned') {
      const user = await User.findById(session.userId);
      if (!user) return next(new AppError('User not found', 404));

      const { accessToken, refreshToken } = generateTokens(user);
      user.refreshTokens.push(refreshToken);
      if (user.refreshTokens.length > 5) user.refreshTokens.shift();
      await user.save();

      // Clean up session
      qrLoginSessions.delete(token);

      res.cookie('refreshToken', refreshToken, cookieOptions);

      return res.status(200).json({
        status: 'success',
        token: accessToken,
        userId: user._id,
        correlationId: req.correlationId
      });
    }

    next(new AppError('Unknown QR session state', 500));
  } catch (err) {
    next(err);
  }
};

export default { signup, login, refresh, logout, setup2FA, verify2FA, disable2FA, loginVerify2FA, status2FA, generateQRLogin, confirmQRLogin, pollQRLogin };

