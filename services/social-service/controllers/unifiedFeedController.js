import UnifiedPost from '../models/UnifiedPost.js';
import UserBehavior from '../models/UserBehavior.js';

/**
 * Strip MongoDB operator characters ($, .) from a string so it is safe
 * to use as part of a MongoDB field-name key (e.g. in dot-notation updates).
 */
const sanitizeKey = (value) => String(value).replace(/[$. ]/g, '_').slice(0, 64);

/**
 * Record a user interaction so the feed can be personalized.
 * Called from POST /unified/behavior
 */
export const recordBehavior = async (req, res) => {
  try {
    const { userId, postType, hashtags = [], authorId } = req.body;
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId is required and must be a string' });
    }
    const safeUserId = sanitizeKey(userId);

    const inc = {};
    if (postType) inc[`typeWeights.${sanitizeKey(postType)}`] = 1;
    if (authorId) inc[`engagedAuthors.${sanitizeKey(authorId)}`] = 1;

    const hashtagInc = {};
    if (Array.isArray(hashtags)) {
      for (const tag of hashtags) {
        hashtagInc[`hashtagWeights.${sanitizeKey(tag)}`] = 1;
      }
    }

    await UserBehavior.findOneAndUpdate(
      { userId: safeUserId },
      { $inc: { ...inc, ...hashtagInc }, $set: { updatedAt: new Date() } },
      { upsert: true, new: true }
    );

    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createPost = async (req, res) => {
  try {
    const post = new UnifiedPost(req.body);
    await post.save();
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Behavior-aware feed.
 *
 * Query params:
 *   userId        – the requesting user (used to load their behavior profile)
 *   followingIds  – comma-separated list of userIds the requester follows
 *   limit         – posts per page (default 20)
 *   page          – page number (default 1)
 */
export const getUnifiedFeed = async (req, res) => {
  try {
    const { userId: rawUserId, followingIds: followingParam, limit = 20, page = 1 } = req.query;
    const userId = rawUserId ? String(rawUserId) : null;

    // Build the MongoDB filter – prefer posts from followed authors when provided
    const filter = {};
    const followingIds = followingParam
      ? followingParam.split(',').map(id => String(id).trim()).filter(Boolean)
      : [];
    if (followingIds.length > 0) {
      filter.userId = { $in: followingIds };
    }

    // Fetch more than needed so we can re-rank and then paginate
    const fetchLimit = Number(limit) * 5;
    const posts = await UnifiedPost.find(filter)
      .sort({ createdAt: -1 })
      .limit(fetchLimit)
      .lean();

    // Load this user's behavior profile (best-effort; missing is fine)
    let behavior = null;
    if (userId) {
      behavior = await UserBehavior.findOne({ userId: String(userId) }).lean();
    }

    const typeWeights = behavior?.typeWeights || {};
    const hashtagWeights = behavior?.hashtagWeights || {};
    const engagedAuthors = behavior?.engagedAuthors || {};

    // Rank posts
    const rankedPosts = posts.map(post => {
      // 1. Interaction weight
      const wLikes = (post.likes?.length || 0) * 1;
      const wUpvotes = (post.upvotes?.length || 0) * 1.5;
      const wComments = (post.commentCount || 0) * 2; // fixed: was commentsCount
      const wRetweets = (post.retweets?.length || 0) * 3;
      const totalWeight = 1 + wLikes + wUpvotes + wComments + wRetweets;

      // 2. Time decay  D = (T+2)^1.8
      const hoursPassed =
        (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
      const decay = Math.pow(hoursPassed + 2, 1.8);

      // 3. Behavior-based affinity
      let affinity = 1.0;

      // Boost for preferred post types
      const typeScore = typeWeights[post.type] || 0;
      if (typeScore > 0) affinity += Math.log1p(typeScore) * 0.5;

      // Boost for preferred hashtags
      for (const tag of (post.hashtags || [])) {
        const tagScore = hashtagWeights[tag] || 0;
        if (tagScore > 0) affinity += Math.log1p(tagScore) * 0.3;
      }

      // Boost for authors the user frequently engages with
      const authorScore = engagedAuthors[post.userId] || 0;
      if (authorScore > 0) affinity += Math.log1p(authorScore) * 0.8;

      // Extra boost for posts from followed users
      if (followingIds.length > 0 && followingIds.includes(post.userId)) {
        affinity += 1.0;
      }

      post.rankScore = (affinity * totalWeight) / decay;
      return post;
    });

    rankedPosts.sort((a, b) => b.rankScore - a.rankScore);

    const pagedPosts = rankedPosts.slice(
      (Number(page) - 1) * Number(limit),
      Number(page) * Number(limit)
    );

    res.json(pagedPosts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const interactWithPost = async (req, res) => {
  try {
    const { postId, userId, action } = req.body; // action: like, retweet, upvote, downvote
    const post = await UnifiedPost.findById(postId);

    if (!post) return res.status(404).json({ error: 'Post not found' });

    switch (action) {
      case 'like':
        post.likes.includes(userId)
          ? (post.likes = post.likes.filter(id => id !== userId))
          : post.likes.push(userId);
        break;
      case 'upvote':
        post.upvotes.push(userId);
        post.downvotes = post.downvotes.filter(id => id !== userId);
        break;
      case 'retweet':
        post.retweets.push(userId);
        break;
    }

    await post.save();

    // Record behavior for feed personalization (fire-and-forget)
    if (userId) {
      const postTypeKey = sanitizeKey(post.type);
      const postAuthorKey = sanitizeKey(post.userId);
      UserBehavior.findOneAndUpdate(
        { userId: String(userId) },
        {
          $inc: {
            [`typeWeights.${postTypeKey}`]: 1,
            [`engagedAuthors.${postAuthorKey}`]: 1,
          },
          $set: { updatedAt: new Date() },
        },
        { upsert: true }
      ).catch(() => {}); // non-blocking
    }

    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
