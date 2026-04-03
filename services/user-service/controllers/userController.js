import User from '../models/User.js';
import UserSettings from '../models/UserSettings.js';

const getProfile = async (req, res, next) => {
  try {
    const userId = req.params.id;
    let user = await User.findOne({ userId }).lean();
    
    // If user record doesn't exist in user-service yet, return a skeleton profile 
    // instead of 404 to avoid frontend errors on first login
    if (!user) {
      return res.json({ 
        status: 'success', 
        data: { 
          userId,
          name: '',
          bio: '',
          avatar: '',
          profileCompleteness: 0,
          isVerified: false
        }, 
        correlationId: req.correlationId 
      });
    }
    
    res.json({ status: 'success', data: user, correlationId: req.correlationId });
  } catch (err) {
    next(err);
  }
};

const calculateProfileCompleteness = (user) => {
  let score = 0;
  if (user.name) score += 20;
  if (user.bio) score += 20;
  if (user.avatar) score += 20;
  if (user.phone) score += 20;
  if (user.username) score += 20;
  return score;
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, avatar, phone, username, coverPhoto } = req.body;
    const userId = req.headers['x-user-id'] || req.body.userId; 

    if (!userId) return res.status(400).json({ status: 'fail', message: 'User ID is required' });

    let user = await User.findOne({ userId });
    if (!user) {
      user = new User({ userId, name, bio, avatar, phone, username, coverPhoto });
    } else {
      if (name) user.name = name;
      if (bio) user.bio = bio;
      if (avatar) user.avatar = avatar;
      if (phone) user.phone = phone;
      if (username) user.username = username;
      if (coverPhoto) user.coverPhoto = coverPhoto;
    }
    
    user.profileCompleteness = calculateProfileCompleteness(user);
    await user.save();
    
    res.json({ status: 'success', data: user, correlationId: req.correlationId });
  } catch (err) {
    next(err);
  }
};

const submitKYC = async (req, res, next) => {
  try {
    const { documents } = req.body;
    const userId = req.headers['x-user-id'];
    
    if (!userId) return res.status(401).json({ status: 'fail', message: 'Unauthorized' });
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ status: 'fail', message: 'KYC documents are required' });
    }

    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ status: 'fail', message: 'User not found' });

    user.kycStatus = 'pending';
    user.kycDocuments = documents;
    await user.save();

    res.json({ status: 'success', message: 'KYC submitted successfully', data: { kycStatus: user.kycStatus }, correlationId: req.correlationId });
  } catch (err) {
    next(err);
  }
};

const getKYCStatus = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ status: 'fail', message: 'User not found' });

    res.json({ status: 'success', data: { kycStatus: user.kycStatus, isVerified: user.isVerified }, correlationId: req.correlationId });
  } catch (err) {
    next(err);
  }
};

const verifyKYC = async (req, res, next) => {
  try {
    const { userId, status } = req.body; // In a real app, this would be an admin-only endpoint
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid status' });
    }

    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ status: 'fail', message: 'User not found' });

    user.kycStatus = status;
    if (status === 'verified') {
      user.isVerified = true;
    } else {
      user.isVerified = false;
    }
    await user.save();

    res.json({ status: 'success', message: `KYC ${status}`, data: user, correlationId: req.correlationId });
  } catch (err) {
    next(err);
  }
};

const getSettings = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] || req.query.userId;
    if (!userId) return res.status(400).json({ status: 'fail', message: 'User ID is required' });

    const settings = await UserSettings.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId } },
      { upsert: true, new: true }
    );
    res.json({ status: 'success', data: settings, correlationId: req.correlationId });
  } catch (err) {
    next(err);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] || req.body.userId;
    if (!userId) return res.status(400).json({ status: 'fail', message: 'User ID is required' });

    const { permissions, theme, language, onboardingCompleted } = req.body;

    const update = {};
    if (permissions) {
      Object.entries(permissions).forEach(([key, value]) => {
        update[`permissions.${key}`] = value;
      });
    }
    if (theme) update.theme = theme;
    if (language) update.language = language;
    if (onboardingCompleted !== undefined) update.onboardingCompleted = onboardingCompleted;

    const settings = await UserSettings.findOneAndUpdate(
      { userId },
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ status: 'success', data: settings, correlationId: req.correlationId });
  } catch (err) {
    next(err);
  }
};

const followUser = async (req, res, next) => {
  try {
    const { followerId, followingId } = req.body;
    if (followerId === followingId) return res.status(400).json({ status: 'fail', message: 'Cannot follow yourself' });

    await User.updateOne({ userId: followingId }, { $addToSet: { followers: followerId } });
    await User.updateOne({ userId: followerId }, { $addToSet: { following: followingId } });

    res.json({ status: 'success', message: 'Followed successfully', correlationId: req.correlationId });
  } catch (err) {
    next(err);
  }
};

const blockUser = async (req, res, next) => {
  try {
    const { userId, blockId } = req.body;
    await User.updateOne({ userId }, { $addToSet: { blocked: blockId } });
    res.json({ status: 'success', message: 'User blocked', correlationId: req.correlationId });
  } catch (err) {
    next(err);
  }
};

const listProfiles = async (req, res, next) => {
  try {
    const users = await User.find({}).limit(50).lean();
    res.json({ status: 'success', data: users, correlationId: req.correlationId });
  } catch (err) {
    next(err);
  }
};

export default { getProfile, updateProfile, getSettings, updateSettings, followUser, blockUser, listProfiles, submitKYC, getKYCStatus, verifyKYC };
