import mongoose from 'mongoose';

// Stores every search query a user performs across all categories.
const searchHistorySchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  query: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['all', 'users', 'posts', 'marketplace', 'hotels', 'restaurants', 'jobs', 'rides', 'food'],
    default: 'all',
  },
  resultsCount: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

searchHistorySchema.index({ userId: 1, timestamp: -1 });

// TTL: keep search history for 90 days
searchHistorySchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export default mongoose.model('SearchHistory', searchHistorySchema);
