import AdvancedProfile from '../models/AdvancedProfile.js';
import Follower from '../models/Follower.js';
import QRCode from 'qrcode';

// Get or Create Profile
export const updateProfile = async (req, res) => {
  try {
    const { userId, username, avatar, bio, location, website, profileMarkdown, isPublic, whoCanView } = req.body;
    
    // Generate uniqueId if new
    let profile = await AdvancedProfile.findOne({ userId });
    if (!profile) {
      const uniqueId = `user_${Math.floor(Math.random() * 100000)}`;
      profile = new AdvancedProfile({ userId, username, uniqueId });
    }

    if (username) profile.username = username;
    if (avatar) profile.avatar = avatar;
    if (bio) profile.bio = bio;
    if (location) profile.location = location;
    if (website) profile.website = website;
    if (profileMarkdown) profile.profileMarkdown = profileMarkdown;
    if (isPublic !== undefined) profile.isPublic = isPublic;
    if (whoCanView) profile.whoCanView = whoCanView;

    await profile.save();
    res.json(profile);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Username already taken' });
    res.status(500).json({ error: err.message });
  }
};

export const getProfileByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const profile = await AdvancedProfile.findOne({
      $or: [
        { username },
        { userId: username },
        { uniqueId: username }
      ]
    });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    // Increment profile views
    profile.profileViews += 1;
    await profile.save();

    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const toggleFollow = async (req, res) => {
  try {
    const { followerId, followingId } = req.body;
    
    const existing = await Follower.findOne({ followerId, followingId });
    if (existing) {
      // Unfollow
      await Follower.findByIdAndDelete(existing._id);
      await AdvancedProfile.findOneAndUpdate({ userId: followerId }, { $inc: { followingCount: -1 } });
      await AdvancedProfile.findOneAndUpdate({ userId: followingId }, { $inc: { followersCount: -1 } });
      res.json({ message: 'Unfollowed successfully', isFollowing: false });
    } else {
      // Follow
      const follow = new Follower({ followerId, followingId });
      await follow.save();
      await AdvancedProfile.findOneAndUpdate({ userId: followerId }, { $inc: { followingCount: 1 } });
      await AdvancedProfile.findOneAndUpdate({ userId: followingId }, { $inc: { followersCount: 1 } });
      
      // Check if mutual (Connection)
      const mutual = await Follower.findOne({ followerId: followingId, followingId: followerId });
      if (mutual) {
        await AdvancedProfile.updateMany(
          { userId: { $in: [followerId, followingId] } },
          { $inc: { connectionsCount: 1 } }
        );
      }
      res.json({ message: 'Followed successfully', isFollowing: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const searchProfiles = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const profiles = await AdvancedProfile.find({ $text: { $search: q } }).limit(20);
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const generateProfileQR = async (req, res) => {
  try {
    const { username } = req.params;
    const url = `${process.env.FRONTEND_URL}/u/${username}`;
    const qrCodeDataUrl = await QRCode.toDataURL(url);
    res.json({ qrCode: qrCodeDataUrl, url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const followers = await Follower.find({ followingId: userId }).lean();
    const followerIds = followers.map((item) => item.followerId);
    const profiles = await AdvancedProfile.find({ userId: { $in: followerIds } }).lean();
    const profilesMap = new Map(profiles.map((p) => [p.userId, p]));

    const enriched = followers.map((item) => {
      const p = profilesMap.get(item.followerId);
      return {
        followerId: item.followerId,
        followingId: item.followingId,
        followedAt: item.createdAt,
        userId: item.followerId,
        username: p?.username || item.followerId,
        avatar: p?.avatar || '',
        uniqueId: p?.uniqueId || ''
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const following = await Follower.find({ followerId: userId }).lean();
    const followingIds = following.map((item) => item.followingId);
    const profiles = await AdvancedProfile.find({ userId: { $in: followingIds } }).lean();
    const profilesMap = new Map(profiles.map((p) => [p.userId, p]));

    const enriched = following.map((item) => {
      const p = profilesMap.get(item.followingId);
      return {
        followerId: item.followerId,
        followingId: item.followingId,
        followedAt: item.createdAt,
        userId: item.followingId,
        username: p?.username || item.followingId,
        avatar: p?.avatar || '',
        uniqueId: p?.uniqueId || ''
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getFriends = async (req, res) => {
  try {
    const { userId } = req.params;
    // Friends = users who mutually follow each other
    const following = await Follower.find({ followerId: userId }).lean();
    const followingIds = following.map((f) => f.followingId);

    if (followingIds.length === 0) return res.json([]);

    // Find which of those are also following back
    const mutualFollows = await Follower.find({
      followerId: { $in: followingIds },
      followingId: userId
    }).lean();

    const friendIds = mutualFollows.map((f) => f.followerId);
    if (friendIds.length === 0) return res.json([]);

    const profiles = await AdvancedProfile.find({ userId: { $in: friendIds } }).lean();
    const enriched = profiles.map((p) => ({
      userId: p.userId,
      username: p.username,
      avatar: p.avatar || '',
      uniqueId: p.uniqueId,
      bio: p.bio || '',
      followersCount: p.followersCount || 0,
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getPeopleYouMayKnow = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Math.max(1, Math.min(Number(req.query.limit) || 6, 20));

    const followingDocs = await Follower.find({ followerId: userId }).lean();
    const followingIds = followingDocs.map((f) => f.followingId);
    const excluded = [...new Set([userId, ...followingIds])];

    const suggestions = await AdvancedProfile.find({ userId: { $nin: excluded } })
      .sort({ followersCount: -1, profileViews: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    const candidateIds = suggestions.map((s) => s.userId);
    let mutualMap = new Map();

    if (candidateIds.length > 0 && followingIds.length > 0) {
      const mutuals = await Follower.aggregate([
        { $match: { followerId: { $in: followingIds }, followingId: { $in: candidateIds } } },
        { $group: { _id: '$followingId', count: { $sum: 1 } } }
      ]);
      mutualMap = new Map(mutuals.map((m) => [m._id, m.count]));
    }

    const payload = suggestions.map((item) => ({
      userId: item.userId,
      username: item.username,
      avatar: item.avatar || '',
      uniqueId: item.uniqueId,
      bio: item.bio || '',
      followersCount: item.followersCount || 0,
      followingCount: item.followingCount || 0,
      mutualCount: mutualMap.get(item.userId) || 0,
      isFollowing: false
    }));

    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
