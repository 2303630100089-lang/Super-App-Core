import mongoose from 'mongoose';

/**
 * Tracks per-user interaction history for feed personalization.
 * Counts how many times a user has interacted with each post type and hashtag.
 */
const userBehaviorSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },

  // Interaction counts per post type (tweet, post, thread, reddit_post, …)
  typeWeights: {
    type: Map,
    of: Number,
    default: {},
  },

  // Interaction counts per hashtag
  hashtagWeights: {
    type: Map,
    of: Number,
    default: {},
  },

  // IDs of users whose content this user regularly engages with
  engagedAuthors: {
    type: Map,
    of: Number,
    default: {},
  },

  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

userBehaviorSchema.index({ userId: 1 });

export default mongoose.model('UserBehavior', userBehaviorSchema);
