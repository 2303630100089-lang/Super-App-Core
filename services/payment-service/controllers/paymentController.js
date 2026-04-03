import PaymentProfile from '../models/PaymentProfile.js';
import Transaction from '../models/Transaction.js';
import crypto from 'crypto';
import qrcode from 'qrcode';

// ==========================================
// HELPERS
// ==========================================

const generateWalletId = () => `wallet_${crypto.randomUUID().split('-')[0]}`;
const generateReference = () => `TXN${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

/**
 * Sanitize a user-supplied ID to a plain string to prevent NoSQL injection.
 * Rejects objects / arrays passed in query parameters.
 */
const sanitizeId = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return null; // reject $gt, $where, etc.
  return String(value);
};

/**
 * Basic fraud detection: checks velocity, amount thresholds, and suspicious patterns.
 * Returns a risk score (0-100) and flags if score > 70.
 */
const assessFraudRisk = async (senderId, amount, deviceId, ipAddress) => {
  const safeId = sanitizeId(senderId);
  let riskScore = 0;

  // High-value single transaction
  if (amount > 10000) riskScore += 20;
  if (amount > 25000) riskScore += 30;

  // Velocity check: count transactions in last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await Transaction.countDocuments({
    senderId: safeId,
    createdAt: { $gte: oneHourAgo },
    status: 'success',
  });
  if (recentCount > 5) riskScore += 20;
  if (recentCount > 10) riskScore += 30;

  // Daily limit check
  const profile = await PaymentProfile.findOne({ userId: safeId });
  if (profile) {
    const resetNeeded = profile.dailyLimitResetAt < new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dailyTotal = resetNeeded ? 0 : profile.dailyTransferTotal;
    if (dailyTotal + amount > profile.dailyTransferLimit) riskScore += 40;
  }

  return { riskScore, flagged: riskScore >= 70 };
};

/**
 * Generate a payment QR code for a given userId/UPI ID.
 */
const generatePaymentQR = async (userId, upiId, amount = null) => {
  const qrPayload = JSON.stringify({
    action: 'upi_payment',
    upiId,
    userId,
    ...(amount ? { amount } : {}),
    ts: Date.now(),
  });
  return qrcode.toDataURL(qrPayload);
};

// ==========================================
// PROFILE MANAGEMENT
// ==========================================

export const createProfile = async (req, res) => {
  try {
    const userId = sanitizeId(req.headers['x-user-id'] || req.body.userId);
    const upiId = req.body.upiId ? sanitizeId(req.body.upiId) : null;

    if (!userId) return res.status(400).json({ error: 'Invalid userId' });

    let profile = await PaymentProfile.findOne({ userId });
    if (profile) return res.status(200).json(profile);

    const walletId = generateWalletId();
    const resolvedUpiId = upiId || `${userId}@superapp`;
    const qrCode = await generatePaymentQR(userId, resolvedUpiId);

    profile = new PaymentProfile({ 
      userId, 
      upiId: resolvedUpiId,
      walletId,
      qrCode,
      balance: 1000, // Welcome bonus
    });
    
    await profile.save();
    res.status(201).json({ status: 'success', data: profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = sanitizeId(req.params.userId || req.headers['x-user-id']);
    if (!userId) return res.status(400).json({ error: 'Invalid userId' });

    let profile = await PaymentProfile.findOne({ userId });
    
    if (!profile) {
      const walletId = generateWalletId();
      const upiId = `${userId}@superapp`;
      const qrCode = await generatePaymentQR(userId, upiId);
      profile = await PaymentProfile.create({ userId, upiId, walletId, qrCode, balance: 1000 });
    }
    
    res.json({ status: 'success', data: profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// QR PAYMENT
// ==========================================

/**
 * Generate a one-time payment QR token (for merchant/P2P payments).
 * The payer scans this QR to initiate the payment.
 */
export const generateQRPayment = async (req, res) => {
  try {
    const receiverId = sanitizeId(req.headers['x-user-id'] || req.body.receiverId);
    const { amount, description } = req.body;

    if (!receiverId) return res.status(400).json({ error: 'Invalid receiverId' });
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const receiverProfile = await PaymentProfile.findOne({ userId: receiverId });
    if (!receiverProfile) return res.status(404).json({ error: 'Receiver wallet not found' });

    const qrToken = crypto.randomUUID();
    const qrPayload = JSON.stringify({
      action: 'pay',
      qrToken,
      receiverId,
      receiverUpiId: receiverProfile.upiId,
      amount,
      description: description ? String(description) : '',
      expiresAt: Date.now() + 10 * 60 * 1000,
    });
    const qrImage = await qrcode.toDataURL(qrPayload);

    res.status(200).json({ status: 'success', data: { qrToken, qrImage, amount, expiresIn: 600 } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Pay via a QR token (payer calls this after scanning).
 */
export const payViaQR = async (req, res) => {
  try {
    const senderId = sanitizeId(req.headers['x-user-id'] || req.body.senderId);
    const receiverId = sanitizeId(req.body.receiverId);
    const { qrToken, amount, deviceId, ipAddress } = req.body;

    if (!senderId || !receiverId) return res.status(400).json({ error: 'Invalid sender or receiver' });
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
    if (senderId === receiverId) return res.status(400).json({ error: 'Cannot pay yourself' });

    // Fraud assessment
    const { riskScore, flagged } = await assessFraudRisk(senderId, amount, deviceId, ipAddress);

    const senderProfile = await PaymentProfile.findOne({ userId: senderId });
    if (!senderProfile) return res.status(404).json({ error: 'Sender wallet not found' });
    if (senderProfile.isSuspended) return res.status(403).json({ error: 'Wallet suspended due to suspicious activity' });
    if (senderProfile.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });

    const receiverProfile = await PaymentProfile.findOne({ userId: receiverId });
    if (!receiverProfile) return res.status(404).json({ error: 'Receiver wallet not found' });

    // Update balances
    senderProfile.balance -= amount;
    receiverProfile.balance += amount;

    // Update daily totals
    const resetNeeded = senderProfile.dailyLimitResetAt < new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (resetNeeded) {
      senderProfile.dailyTransferTotal = amount;
      senderProfile.dailyLimitResetAt = new Date();
    } else {
      senderProfile.dailyTransferTotal += amount;
    }

    if (flagged) {
      senderProfile.fraudFlags += 1;
      if (senderProfile.fraudFlags >= 3) senderProfile.isSuspended = true;
    }

    await senderProfile.save();
    await receiverProfile.save();

    const transaction = new Transaction({
      senderId,
      receiverId,
      amount,
      type: 'payment',
      status: 'success',
      qrToken,
      reference: generateReference(),
      riskScore,
      flagged,
      flagReason: flagged ? 'High risk score' : undefined,
      deviceId,
      ipAddress,
      description: 'QR Payment',
    });
    await transaction.save();

    res.status(201).json({ status: 'success', data: transaction });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// P2P TRANSFER
// ==========================================

export const initiateTransfer = async (req, res) => {
  try {
    const senderId = sanitizeId(req.headers['x-user-id'] || req.body.senderId);
    const receiverId = sanitizeId(req.body.receiverId);
    const { amount, description, deviceId, ipAddress } = req.body;
    
    if (!senderId || !receiverId) return res.status(400).json({ error: 'Invalid sender or receiver' });
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
    if (senderId === receiverId) return res.status(400).json({ error: 'Cannot transfer to yourself' });

    const { riskScore, flagged } = await assessFraudRisk(senderId, amount, deviceId, ipAddress);

    const senderProfile = await PaymentProfile.findOne({ userId: senderId });
    if (!senderProfile || senderProfile.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    if (senderProfile.isSuspended) {
      return res.status(403).json({ error: 'Wallet suspended' });
    }

    const receiverProfile = await PaymentProfile.findOne({ userId: receiverId });
    if (!receiverProfile) return res.status(404).json({ error: 'Receiver not found' });

    senderProfile.balance -= amount;
    receiverProfile.balance += amount;

    const resetNeeded = senderProfile.dailyLimitResetAt < new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (resetNeeded) {
      senderProfile.dailyTransferTotal = amount;
      senderProfile.dailyLimitResetAt = new Date();
    } else {
      senderProfile.dailyTransferTotal += amount;
    }

    if (flagged) {
      senderProfile.fraudFlags += 1;
      if (senderProfile.fraudFlags >= 3) senderProfile.isSuspended = true;
    }

    await senderProfile.save();
    await receiverProfile.save();

    const transaction = new Transaction({ 
      senderId, 
      receiverId, 
      amount, 
      description,
      type: 'transfer',
      status: 'success',
      reference: generateReference(),
      riskScore,
      flagged,
      deviceId,
      ipAddress,
    });
    await transaction.save();

    res.status(201).json({ status: 'success', data: transaction });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// TOP-UP
// ==========================================

export const addMoney = async (req, res) => {
  try {
    const userId = sanitizeId(req.body.userId || req.headers['x-user-id']);
    const { amount } = req.body;
    if (!userId) return res.status(400).json({ error: 'Invalid userId' });
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const profile = await PaymentProfile.findOne({ userId });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    
    profile.balance += amount;
    await profile.save();

    const transaction = new Transaction({
      senderId: 'SYSTEM',
      receiverId: userId,
      amount,
      type: 'add_money',
      status: 'success',
      reference: generateReference(),
      description: 'Wallet Top-up'
    });
    await transaction.save();

    res.status(200).json({ status: 'success', data: profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// REFUNDS
// ==========================================

export const initiateRefund = async (req, res) => {
  try {
    const requestorId = sanitizeId(req.headers['x-user-id'] || req.body.requestorId);
    const { transactionId, reason } = req.body;

    if (!requestorId) return res.status(400).json({ error: 'Unauthorized' });

    const originalTxn = await Transaction.findById(transactionId);
    if (!originalTxn) return res.status(404).json({ error: 'Transaction not found' });
    if (originalTxn.status === 'refunded') return res.status(400).json({ error: 'Already refunded' });
    if (originalTxn.receiverId !== requestorId) {
      return res.status(403).json({ error: 'Only the recipient can initiate a refund' });
    }

    // Reverse the transfer
    const senderProfile = await PaymentProfile.findOne({ userId: originalTxn.senderId });
    const receiverProfile = await PaymentProfile.findOne({ userId: originalTxn.receiverId });

    if (!receiverProfile || receiverProfile.balance < originalTxn.amount) {
      return res.status(400).json({ error: 'Insufficient balance for refund' });
    }

    receiverProfile.balance -= originalTxn.amount;
    if (senderProfile) senderProfile.balance += originalTxn.amount;

    await receiverProfile.save();
    if (senderProfile) await senderProfile.save();

    // Mark original as refunded
    originalTxn.status = 'refunded';
    await originalTxn.save();

    // Create refund transaction
    const refundTxn = new Transaction({
      senderId: originalTxn.receiverId,
      receiverId: originalTxn.senderId,
      amount: originalTxn.amount,
      type: 'refund',
      status: 'success',
      reference: generateReference(),
      originalTransactionId: originalTxn._id,
      refundReason: reason || 'Customer request',
      description: `Refund for ${originalTxn.reference}`,
    });
    await refundTxn.save();

    res.status(200).json({ status: 'success', data: refundTxn });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// DEVICE BINDING
// ==========================================

export const bindDevice = async (req, res) => {
  try {
    const userId = sanitizeId(req.headers['x-user-id'] || req.body.userId);
    const deviceId = req.body.deviceId ? String(req.body.deviceId) : null;
    const userAgent = req.body.userAgent ? String(req.body.userAgent).substring(0, 512) : null;
    const ipAddress = req.ip || req.headers['x-forwarded-for'];

    if (!userId || !deviceId) return res.status(400).json({ error: 'userId and deviceId are required' });

    const profile = await PaymentProfile.findOne({ userId });
    if (!profile) return res.status(404).json({ error: 'Wallet not found' });

    if (profile.deviceFingerprints.length >= 3) {
      return res.status(400).json({ error: 'Maximum 3 devices allowed. Remove a device first.' });
    }

    const alreadyBound = profile.deviceFingerprints.some(d => d.deviceId === deviceId);
    if (!alreadyBound) {
      profile.deviceFingerprints.push({ deviceId, userAgent, ip: ipAddress });
      await profile.save();
    }

    res.status(200).json({ status: 'success', message: 'Device bound successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const unbindDevice = async (req, res) => {
  try {
    const userId = sanitizeId(req.headers['x-user-id'] || req.body.userId);
    const deviceId = req.body.deviceId ? String(req.body.deviceId) : null;

    if (!userId || !deviceId) return res.status(400).json({ error: 'userId and deviceId are required' });

    const profile = await PaymentProfile.findOne({ userId });
    if (!profile) return res.status(404).json({ error: 'Wallet not found' });

    profile.deviceFingerprints = profile.deviceFingerprints.filter(d => d.deviceId !== deviceId);
    await profile.save();

    res.status(200).json({ status: 'success', message: 'Device unbound' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// TRANSACTIONS
// ==========================================

const ALLOWED_TXN_TYPES = ['add_money', 'transfer', 'payment', 'refund', 'merchant', 'subscription', 'fee'];

export const getTransactions = async (req, res) => {
  try {
    const userId = sanitizeId(req.params.userId || req.headers['x-user-id']);
    const { type, page = 1, limit = 30 } = req.query;
    if (!userId) return res.status(400).json({ error: 'Invalid userId' });

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { $or: [{ senderId: userId }, { receiverId: userId }] };
    if (type && ALLOWED_TXN_TYPES.includes(String(type))) filter.type = String(type);

    const [transactions, total] = await Promise.all([
      Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Transaction.countDocuments(filter),
    ]);

    res.json({ status: 'success', data: transactions, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// MERCHANT PAYMENT
// ==========================================

export const merchantPayment = async (req, res) => {
  try {
    const senderId = sanitizeId(req.headers['x-user-id'] || req.body.senderId);
    const merchantId = sanitizeId(req.body.merchantId);
    const { amount, description, orderId, deviceId, ipAddress } = req.body;

    if (!senderId || !merchantId) return res.status(400).json({ error: 'Invalid sender or merchant' });
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const { riskScore, flagged } = await assessFraudRisk(senderId, amount, deviceId, ipAddress);

    const senderProfile = await PaymentProfile.findOne({ userId: senderId });
    if (!senderProfile || senderProfile.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    if (senderProfile.isSuspended) {
      return res.status(403).json({ error: 'Wallet suspended' });
    }

    const merchantProfile = await PaymentProfile.findOne({ userId: merchantId });
    if (!merchantProfile) return res.status(404).json({ error: 'Merchant wallet not found' });

    // Platform fee: 2% (in production this goes to platform wallet)
    const fee = Math.round(amount * 0.02 * 100) / 100;
    const netAmount = amount - fee;

    senderProfile.balance -= amount;
    merchantProfile.balance += netAmount;

    await senderProfile.save();
    await merchantProfile.save();

    const transaction = new Transaction({
      senderId,
      receiverId: merchantId,
      amount,
      type: 'merchant',
      status: 'success',
      reference: generateReference(),
      description: description ? String(description) : `Order ${orderId}`,
      merchantId,
      riskScore,
      flagged,
      deviceId,
      ipAddress,
    });
    await transaction.save();

    res.status(201).json({ status: 'success', data: { transaction, fee, netAmount } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
