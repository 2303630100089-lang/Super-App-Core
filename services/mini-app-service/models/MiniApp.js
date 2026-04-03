import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, maxlength: 500 },
  createdAt: { type: Date, default: Date.now },
});

const miniAppSchema = new mongoose.Schema({
  appId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  shortDescription: { type: String, maxlength: 120 },
  icon: { type: String },
  screenshots: [{ type: String }],
  developerId: { type: String, required: true },
  developerName: { type: String },
  entryUrl: { type: String, required: true },
  version: { type: String, default: '1.0.0' },
  category: {
    type: String,
    enum: ['utility', 'social', 'entertainment', 'shopping', 'productivity', 'finance', 'travel', 'health', 'education', 'games'],
    required: true,
  },
  tags: [{ type: String }],
  permissions: [{
    type: String,
    enum: ['location', 'camera', 'microphone', 'contacts', 'storage', 'notifications', 'payments', 'identity'],
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'under_review', 'rejected', 'suspended'],
    default: 'under_review',
  },
  rejectionReason: { type: String },
  // Store metrics
  installCount: { type: Number, default: 0 },
  activeUsers: { type: Number, default: 0 },
  // Revenue sharing
  revenueSharePercent: { type: Number, default: 70 }, // Developer gets 70%, platform 30%
  totalRevenue: { type: Number, default: 0 },
  // Ratings
  reviews: [reviewSchema],
  averageRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  // Features
  supportsOffline: { type: Boolean, default: false },
  isPaid: { type: Boolean, default: false },
  price: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
}, { timestamps: true });

// Indexes
miniAppSchema.index({ category: 1, status: 1 });
miniAppSchema.index({ developerId: 1 });
miniAppSchema.index({ isFeatured: 1, status: 1 });
miniAppSchema.index({ installCount: -1, status: 1 });

export default mongoose.model('MiniApp', miniAppSchema);
