import mongoose from 'mongoose';

/**
 * Tracks SDK events reported by mini apps running inside the SuperApp.
 * Used for analytics and revenue attribution.
 */
const sdkEventSchema = new mongoose.Schema({
  appId: { type: String, required: true, index: true },
  developerId: { type: String, required: true, index: true },
  userId: { type: String, index: true },
  eventType: {
    type: String,
    enum: [
      'app_open', 'app_close', 'page_view', 'button_click',
      'purchase', 'payment_request', 'share', 'error',
    ],
    required: true,
  },
  payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  sessionId: { type: String },
  deviceType: { type: String, enum: ['mobile', 'tablet', 'desktop'], default: 'mobile' },
  country: { type: String },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: false });

sdkEventSchema.index({ appId: 1, timestamp: -1 });
sdkEventSchema.index({ developerId: 1, timestamp: -1 });
sdkEventSchema.index({ eventType: 1, timestamp: -1 });

export default mongoose.model('SdkEvent', sdkEventSchema);
