import Post from '../models/Post.js';
import Comment from '../models/Comment.js';

// Create post
const createPost = async (req, res) => {
  try {
    const { userId, userName, userAvatar, content, type, media, hashtags, mentions, metadata, isReel, title, communityId, communityName, flairs, isNSFW, isSpoiler, isOriginalContent, quotedPostId, isDraft, scheduledAt, visibility } = req.body;
    
    // Check if it has a title or community, implicitly make it a reddit-like post (unless it's a repost)
    const postType = type === 'repost' ? 'repost' : (title || communityId) ? 'reddit_post' : (type || 'text');
    
    const post = new Post({ 
      userId, userName, userAvatar, content, type: postType, media, hashtags, mentions, metadata, isReel,
      title, communityId, communityName, flairs, isNSFW, isSpoiler, isOriginalContent, quotedPostId,
      isDraft: isDraft || false,
      scheduledAt: scheduledAt || null,
      visibility: visibility || 'public',
    });
    
    await post.save();
    
    if (quotedPostId) {
       await Post.findByIdAndUpdate(quotedPostId, { $addToSet: { shares: userId } });
    }
    
    res.status(201).json({ status: 'success', data: post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Reddit-Style Post Voting
const votePost = async (req, res) => {
  try {
    const { postId, userId, voteType } = req.body; // voteType: 'upvote', 'downvote', 'none'
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Remove existing votes first
    post.upvotes = post.upvotes.filter(id => id !== userId);
    post.downvotes = post.downvotes.filter(id => id !== userId);

    if (voteType === 'upvote') {
      post.upvotes.push(userId);
    } else if (voteType === 'downvote') {
      post.downvotes.push(userId);
    } // 'none' just clears the vote
    
    post.score = post.upvotes.length - post.downvotes.length;
    await post.save();
    res.json({ status: 'success', data: post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Give award to post
const awardPost = async (req, res) => {
  try {
    const { postId, userId, awardId, name, icon } = req.body;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    const existingAward = post.awards.find(a => a.awardId === awardId);
    if (existingAward) {
      existingAward.count += 1;
    } else {
      post.awards.push({ awardId, name, icon, givenBy: userId, count: 1 });
    }
    
    await post.save();
    res.json({ status: 'success', data: post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Legacy Toggle like
const likePost = async (req, res) => {
  try {
    const { postId, userId } = req.body;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    if (post.likes.includes(userId)) {
      post.likes = post.likes.filter(id => id !== userId);
    } else {
      post.likes.push(userId);
    }
    await post.save();
    res.json({ status: 'success', data: post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Vote on poll option
const votePoll = async (req, res) => {
  try {
    const { postId, userId, optionIndex } = req.body;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const totalOptions = post.metadata?.options?.length || 0;
    for (let i = 0; i < totalOptions; i++) {
      const key = String(i);
      const existing = post.pollVotes.get(key) || [];
      post.pollVotes.set(key, existing.filter(id => id !== userId));
    }

    const key = String(optionIndex);
    const current = post.pollVotes.get(key) || [];
    current.push(userId);
    post.pollVotes.set(key, current);
    post.markModified('pollVotes');

    await post.save();
    res.json({ status: 'success', data: post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add nested reddit-style comment
const addComment = async (req, res) => {
  try {
    const { postId, parentId, userId, userName, userAvatar, content } = req.body;
    
    let depth = 0;
    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      if (parentComment) depth = parentComment.depth + 1;
    }
    
    const comment = new Comment({ postId, parentId: parentId || null, depth, userId, userName, userAvatar, content });
    await comment.save();
    
    await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });
    
    res.status(201).json({ status: 'success', data: comment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Vote on comment
const voteComment = async (req, res) => {
  try {
    const { commentId, userId, voteType } = req.body; // 'upvote', 'downvote', 'none'
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    
    comment.upvotes = comment.upvotes.filter(id => id !== userId);
    comment.downvotes = comment.downvotes.filter(id => id !== userId);
    
    if (voteType === 'upvote') comment.upvotes.push(userId);
    else if (voteType === 'downvote') comment.downvotes.push(userId);
    
    comment.score = comment.upvotes.length - comment.downvotes.length;
    await comment.save();
    
    res.json({ status: 'success', data: comment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get threaded comments for a post
const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const sortMethod = req.query.sort === 'new' ? { createdAt: -1 } : { score: -1, createdAt: -1 };
    
    const comments = await Comment.find({ postId }).sort(sortMethod);
    res.json({ status: 'success', data: comments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get feed — all posts (mix of normal and reddit)
const getFeed = async (req, res) => {
  try {
    const { followingIds, page = 1, limit = 30, sort = 'recent', communityId, filterType } = req.body;
    
    const now = new Date();
    const filter = { isReel: false, isDraft: { $ne: true }, $or: [{ scheduledAt: null }, { scheduledAt: { $lte: now } }] };
    if (followingIds && followingIds.length > 0) {
      filter.userId = { $in: followingIds };
    }
    if (communityId) filter.communityId = communityId;
    if (filterType === 'reddit') filter.type = 'reddit_post';
    
    let sortMethod = { createdAt: -1 }; // new/recent
    if (sort === 'hot' || sort === 'top') {
      sortMethod = { score: -1, createdAt: -1 };
    }
    
    const posts = await Post.find(filter)
      .sort(sortMethod)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();
      
    res.json({ status: 'success', data: posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getExplore = async (req, res) => {
  try {
    const { hashtag } = req.query;
    const filter = hashtag ? { hashtags: hashtag } : {};
    const posts = await Post.find(filter).sort({ score: -1, createdAt: -1 }).limit(30).lean();
    res.json({ status: 'success', data: posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getReels = async (req, res) => {
  try {
    const { page = 1, limit = 10, category } = req.query;
    const filter = { isReel: true };
    if (category) filter.hashtags = category;

    // Advanced TikTok style algorithm: mix of high score (hot) and recent
    const reels = await Post.find(filter)
      .sort({ score: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    res.json({ status: 'success', data: reels });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await Post.find({ userId, isReel: false }).sort({ createdAt: -1 }).limit(20).lean();
    res.json({ status: 'success', data: posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const toggleInterest = async (req, res) => {
  try {
    const { postId, userId } = req.body;
    const post = await Post.findById(postId);
    
    if (post.interested.includes(userId)) {
      post.interested = post.interested.filter(id => id !== userId);
    } else {
      post.interested.push(userId);
    }
    await post.save();
    res.json({ status: 'success', data: post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Repost functionality
const repostPost = async (req, res) => {
  try {
    const { postId, userId, repostType = 'repost' } = req.body; // repostType: 'repost' or 'quote'
    const originalPost = await Post.findById(postId);
    
    if (!originalPost) return res.status(404).json({ error: 'Post not found' });
    
    // Check if already reposted by same user
    if (originalPost.reposts?.some(r => r.userId === userId)) {
      return res.status(400).json({ error: 'Already reposted by this user' });
    }
    
    // Add repost entry
    if (!originalPost.reposts) originalPost.reposts = [];
    originalPost.reposts.push({ userId, repostType, repostedAt: new Date() });
    await originalPost.save();
    
    // Create a new repost post
    const repostPost = new Post({
      userId,
      type: 'repost',
      quotedPostId: postId,
      content: req.body.quoteText || '', // For quotes
      media: [],
      repostType
    });
    
    await repostPost.save();
    res.status(201).json({ status: 'success', message: 'Post reposted', data: repostPost });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Share post with other users
const sharePost = async (req, res) => {
  try {
    const { postId, userId, targetUserIds, message } = req.body; // targetUserIds: array of user IDs to share to
    const post = await Post.findById(postId);
    
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    // Add share entries
    if (!post.shares) post.shares = [];
    for (const targetUserId of targetUserIds) {
      if (!post.shares.some(s => s.userId === targetUserId)) {
        post.shares.push({ userId: targetUserId, sharedAt: new Date() });
      }
    }
    post.shareCount = post.shares?.length || 0;
    await post.save();
    
    res.json({ status: 'success', message: 'Post shared', data: post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Report post
const reportPost = async (req, res) => {
  try {
    const { postId, userId, reason, description } = req.body;
    const post = await Post.findById(postId);
    
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    // Check if already reported by same user
    if (post.reports?.some(r => r.reportedBy === userId)) {
      return res.status(400).json({ error: 'You have already reported this post' });
    }
    
    // Add report
    if (!post.reports) post.reports = [];
    post.reports.push({ reportedBy: userId, reason, description, reportedAt: new Date() });
    post.reportCount = post.reports.length;
    
    // Auto-delete if 5 reports from different users
    if (post.reportCount >= 5) {
      post.isDeleted = true;
      post.deletionReason = 'Removed due to multiple reports';
      await post.save();
      return res.json({ status: 'success', message: 'Post reported and removed (5 reports)', data: post });
    }
    
    await post.save();
    res.json({ status: 'success', message: 'Post reported successfully', data: post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get post reports (admin function)
const getPostReports = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);
    
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    res.json({ status: 'success', data: post.reports || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete post (by owner or admin)
const deletePost = async (req, res) => {
  try {
    const { postId, userId } = req.body;
    const post = await Post.findById(postId);
    
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.userId !== userId) return res.status(403).json({ error: 'Not authorized to delete this post' });
    
    post.isDeleted = true;
    post.deletionReason = 'Deleted by user';
    await post.save();
    
    res.json({ status: 'success', message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Search posts by hashtag
const searchHashtag = async (req, res) => {
  try {
    const { hashtag, page = 1, limit = 30 } = req.query;
    const posts = await Post.find({ hashtags: hashtag, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    
    res.json({ status: 'success', data: posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Search posts by mentions
const searchMentions = async (req, res) => {
  try {
    const { username, page = 1, limit = 30 } = req.query;
    const posts = await Post.find({ mentions: username, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    
    res.json({ status: 'success', data: posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Edit post (owner only)
const editPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId, content, hashtags, mentions, media, metadata } = req.body;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.userId !== userId) return res.status(403).json({ error: 'Not authorized to edit this post' });

    if (content !== undefined) post.content = content;
    if (hashtags !== undefined) post.hashtags = hashtags;
    if (mentions !== undefined) post.mentions = mentions;
    if (media !== undefined) post.media = media;
    if (metadata !== undefined) post.metadata = metadata;
    await post.save();
    res.json({ status: 'success', data: post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Toggle bookmark / save
const toggleBookmark = async (req, res) => {
  try {
    const { postId, userId } = req.body;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const isSaved = post.savedBy.includes(userId);
    if (isSaved) {
      post.savedBy = post.savedBy.filter(id => id !== userId);
    } else {
      post.savedBy.push(userId);
    }
    await post.save();
    res.json({ status: 'success', bookmarked: !isSaved, data: post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get bookmarked posts for a user
const getBookmarks = async (req, res) => {
  try {
    const { userId } = req.query;
    const { page = 1, limit = 20 } = req.query;
    const posts = await Post.find({ savedBy: userId, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();
    res.json({ status: 'success', data: posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Facebook-style reactions (like, love, haha, wow, sad, angry)
const reactToPost = async (req, res) => {
  try {
    const { postId, userId, reaction } = req.body; // reaction: 'like'|'love'|'haha'|'wow'|'sad'|'angry'|null (null = remove)
    const validReactions = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Remove user from all existing reactions
    for (const r of validReactions) {
      const existing = post.reactions.get(r) || [];
      post.reactions.set(r, existing.filter(id => id !== userId));
    }

    // Add new reaction if provided
    if (reaction && validReactions.includes(reaction)) {
      const current = post.reactions.get(reaction) || [];
      current.push(userId);
      post.reactions.set(reaction, current);
    }
    post.markModified('reactions');
    await post.save();
    res.json({ status: 'success', data: post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Trending hashtags
const getTrendingHashtags = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

    const result = await Post.aggregate([
      { $match: { createdAt: { $gte: since }, isDeleted: false, hashtags: { $exists: true, $ne: [] } } },
      { $unwind: '$hashtags' },
      { $group: { _id: '$hashtags', count: { $sum: 1 }, totalScore: { $sum: '$score' } } },
      { $sort: { count: -1, totalScore: -1 } },
      { $limit: Number(limit) },
      { $project: { hashtag: '$_id', count: 1, totalScore: 1, _id: 0 } }
    ]);

    res.json({ status: 'success', data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single post by ID
const getPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId).lean();
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({ status: 'success', data: post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Edit comment
const editComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId, content } = req.body;
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.userId !== userId) return res.status(403).json({ error: 'Not authorized' });
    comment.content = content;
    comment.isEdited = true;
    await comment.save();
    res.json({ status: 'success', data: comment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete comment (soft delete)
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId } = req.body;
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.userId !== userId) return res.status(403).json({ error: 'Not authorized' });
    comment.isDeleted = true;
    comment.content = '[deleted]';
    await comment.save();
    res.json({ status: 'success', message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Pin/unpin comment (post owner only)
const pinComment = async (req, res) => {
  try {
    const { postId, commentId, userId } = req.body;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.userId !== userId) return res.status(403).json({ error: 'Only post owner can pin comments' });

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    comment.isPinned = !comment.isPinned;
    await comment.save();
    res.json({ status: 'success', pinned: comment.isPinned, data: comment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export default { 
  createPost, likePost, votePost, awardPost, votePoll, 
  addComment, voteComment, getComments, getFeed, getExplore, 
  getReels, getUserPosts, toggleInterest, repostPost, sharePost,
  reportPost, getPostReports, deletePost, searchHashtag, searchMentions,
  editPost, toggleBookmark, getBookmarks, reactToPost, getTrendingHashtags,
  getPost, editComment, deleteComment, pinComment
};
