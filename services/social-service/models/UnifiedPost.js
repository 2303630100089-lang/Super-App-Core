import mongoose from 'mongoose';

const unifiedPostSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: { type: String, enum: ['tweet', 'post', 'thread'], required: true },
  content: { type: String, required: true },
  media: [String],
  parentPostId: { type: mongoose.Schema.Types.ObjectId, ref: 'UnifiedPost' }, // For retweets/quotes
  isQuote: { type: Boolean, default: false },
  
  // Twitter Style
  likes: [String],
  retweets: [String],
  
  // Reddit Style
  upvotes: [String],
  downvotes: [String],
  communityId: { type: String }, // For threads
  
  // Facebook Style
  shares: [String],
  commentCount: { type: Number, default: 0 },
}, { timestamps: true });

unifiedPostSchema.index({ type: 1, createdAt: -1 });
unifiedPostSchema.index({ userId: 1, createdAt: -1 });
unifiedPostSchema.index({ createdAt: -1 });

export default mongoose.model('UnifiedPost', unifiedPostSchema);
