import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, default: '' },
  userAvatar: { type: String, default: '' },
  
  // Cross-compatibility
  type: { type: String, enum: ['text', 'image', 'video', 'poll', 'event', 'alert', 'notice', 'reminder', 'reddit_post', 'repost'], default: 'text' },
  
  // Reddit specific fields
  title: { type: String }, // For Reddit-like posts which have titles
  content: { type: String }, // No longer strictly required (can be empty for simple reposts)
  
  // Repost/Quote feature
  quotedPostId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  
  communityId: { type: String }, // Subreddit-like id or group id
  communityName: { type: String },
  flairs: [{ type: String }],
  isNSFW: { type: Boolean, default: false },
  isSpoiler: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
  isOriginalContent: { type: Boolean, default: false },
  
  media: [{
    url: String,
    mediaType: { type: String, enum: ['image', 'video', 'link'], default: 'image' },
    thumbnail: String
  }],
  
  hashtags: [String],
  mentions: [String],    // @username mentions
  
  // Interactions
  likes: [String],       // standard likes
  shares: [{ 
    userId: String,
    sharedAt: { type: Date, default: Date.now }
  }],      
  savedBy: [String],
  reposts: [{
    userId: String,
    repostType: { type: String, enum: ['repost', 'quote'], default: 'repost' },
    repostedAt: { type: Date, default: Date.now }
  }],     
  
  // Reddit-like Voting
  upvotes: [{ type: String }],
  downvotes: [{ type: String }],
  score: { type: Number, default: 0 }, // upvotes - downvotes
  awards: [{
    awardId: String,
    name: String,
    icon: String,
    givenBy: String,
    count: { type: Number, default: 1 }
  }],
  
  // Facebook-style reactions: { like: [userId], love: [userId], haha: [userId], wow: [userId], sad: [userId], angry: [userId] }
  reactions: { type: Map, of: [String], default: {} },

  // Draft & Scheduling
  isDraft: { type: Boolean, default: false },
  scheduledAt: { type: Date, default: null },
  visibility: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },

  // Metadata & Stats
  commentCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  shareCount: { type: Number, default: 0 },
  isReel: { type: Boolean, default: false },
  metadata: { type: mongoose.Schema.Types.Mixed }, // For polls, events, link metadata
  pollVotes: { type: Map, of: [String], default: {} },
  
  // Reports & Moderation
  reports: [{
    reportedBy: String,
    reason: { type: String, enum: ['offensive', 'spam', 'inappropriate', 'scam', 'harassment'] },
    description: String,
    reportedAt: { type: Date, default: Date.now }
  }],
  reportCount: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false },
  deletionReason: String
}, { timestamps: true });

postSchema.index({ createdAt: -1 });
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ score: -1, createdAt: -1 }); // For hot/top sorting
postSchema.index({ communityId: 1, createdAt: -1 });
postSchema.index({ hashtags: 1 }); // For hashtag search
postSchema.index({ mentions: 1 }); // For mention search
postSchema.index({ reportCount: 1 }); // For finding reported posts
postSchema.index({ isDeleted: 1 }); // For filtering deleted posts

export default mongoose.model('Post', postSchema);
