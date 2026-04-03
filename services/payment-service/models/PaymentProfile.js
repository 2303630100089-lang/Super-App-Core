import mongoose from 'mongoose';

const paymentProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  walletId: { type: String, required: true, unique: true },
  balance: { type: Number, default: 0 },
  coins: { type: Number, default: 0 },
  upiId: { type: String, required: true, unique: true },
  qrCode: { type: String }, // Base64 or URL of the payment QR code
  isActive: { type: Boolean, default: true },
  // Device binding for fraud prevention
  deviceFingerprints: [{
    deviceId: String,
    userAgent: String,
    ip: String,
    boundAt: { type: Date, default: Date.now }
  }],
  // Fraud detection
  dailyTransferLimit: { type: Number, default: 50000 },
  dailyTransferTotal: { type: Number, default: 0 },
  dailyLimitResetAt: { type: Date, default: Date.now },
  fraudFlags: { type: Number, default: 0 },
  isSuspended: { type: Boolean, default: false },
  // Subscription tracking
  activeSubscriptions: [{ type: String }],
}, { timestamps: true });

export default mongoose.model('PaymentProfile', paymentProfileSchema);
