import mongoose from 'mongoose';

/**
 * Developer Account – registered by third-party developers
 * who want to publish mini apps on the SuperApp platform.
 */
const developerAccountSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // Links to auth-service userId
  displayName: { type: String, required: true },
  email: { type: String, required: true },
  website: { type: String },
  description: { type: String },
  avatarUrl: { type: String },
  status: {
    type: String,
    enum: ['pending', 'verified', 'suspended'],
    default: 'pending',
  },
  // API credentials for SDK integration
  apiKey: { type: String, unique: true, sparse: true },
  apiSecret: { type: String },
  // Stats
  totalApps: { type: Number, default: 0 },
  totalInstalls: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  // Payout details
  payoutUpiId: { type: String },
  pendingPayout: { type: Number, default: 0 },
  totalPaidOut: { type: Number, default: 0 },
  // Agreement
  agreedToTerms: { type: Boolean, default: false },
  agreedToTermsAt: { type: Date },
}, { timestamps: true });

developerAccountSchema.index({ userId: 1 });
developerAccountSchema.index({ apiKey: 1 });

export default mongoose.model('DeveloperAccount', developerAccountSchema);
