import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null }, // For deep nesting (Reddit style)
  depth: { type: Number, default: 0 },
  
  userId: { type: String, required: true },
  userName: { type: String, default: '' },
  userAvatar: { type: String, default: '' },
  
  content: { type: String, required: true },
  
  // Interactions
  likes: [String], // Standard likes
  
  // Reddit-like voting
  upvotes: [{ type: String }],
  downvotes: [{ type: String }],
  score: { type: Number, default: 0 },
  awards: [{ name: String, icon: String, count: Number }],
  
  isEdited: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false }, // Useful to preserve thread structure when deleted
  isPinned: { type: Boolean, default: false }, // Post owner can pin a comment
  
  // Legacy simple replies (kept for backward compatibility, but parentId handles deep nesting)
  replies: [{
    userId: String,
    userName: String,
    content: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

commentSchema.index({ postId: 1, parentId: 1, score: -1, createdAt: -1 });

export default mongoose.model('Comment', commentSchema);
