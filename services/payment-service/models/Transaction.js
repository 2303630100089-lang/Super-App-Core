import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'success', 'failed', 'refunded'], default: 'success' },
  reference: { type: String },
  type: { type: String, enum: ['add_money', 'transfer', 'payment', 'refund', 'merchant', 'subscription', 'fee'], default: 'transfer' },
  description: { type: String },
  // QR payment tracking
  qrToken: { type: String },
  merchantId: { type: String },
  // Refund tracking
  originalTransactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  refundReason: { type: String },
  // Fraud tracking
  deviceId: { type: String },
  ipAddress: { type: String },
  riskScore: { type: Number, default: 0 }, // 0-100
  flagged: { type: Boolean, default: false },
  flagReason: { type: String },
}, { timestamps: true });

// Indexes for fast lookups
transactionSchema.index({ senderId: 1, createdAt: -1 });
transactionSchema.index({ receiverId: 1, createdAt: -1 });
transactionSchema.index({ qrToken: 1 });
transactionSchema.index({ reference: 1 });

export default mongoose.model('Transaction', transactionSchema);
