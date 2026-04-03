import MiniApp from '../models/MiniApp.js';
import UserAppInstall from '../models/UserAppInstall.js';
import { v4 as uuidv4 } from 'uuid';

// ==========================================
// INPUT SANITIZATION
// ==========================================

const sanitizeId = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return null; // reject NoSQL injection objects
  return String(value);
};

const ALLOWED_CATEGORIES = ['utility', 'social', 'entertainment', 'shopping', 'productivity', 'finance', 'travel', 'health', 'education', 'games'];
const ALLOWED_SORT = ['popular', 'rating', 'newest'];
const ALLOWED_PERMISSIONS = ['location', 'camera', 'microphone', 'contacts', 'storage', 'notifications', 'payments', 'identity'];

// ==========================================
// DEVELOPER PLATFORM
// ==========================================

/**
 * Register / submit a new mini app for review
 */
const registerApp = async (req, res) => {
  try {
    const developerId = req.headers['x-user-id'] || req.body.developerId;
    const {
      name, description, shortDescription, icon, screenshots, entryUrl,
      category, tags, permissions, version, developerName,
      supportsOffline, isPaid, price,
    } = req.body;

    const appId = `app_${uuidv4().split('-')[0]}_${name.toLowerCase().replace(/\s+/g, '_')}`;

    const miniApp = new MiniApp({
      appId, name, description, shortDescription, icon, screenshots,
      developerId, developerName, entryUrl, category,
      tags: tags || [],
      permissions: permissions || [],
      version: version || '1.0.0',
      supportsOffline: supportsOffline || false,
      isPaid: isPaid || false,
      price: isPaid ? price : 0,
      status: 'under_review',
    });
    await miniApp.save();
    res.status(201).json({ status: 'success', data: miniApp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Update an existing app (developer only)
 */
const updateApp = async (req, res) => {
  try {
    const developerId = req.headers['x-user-id'] || req.body.developerId;
    const { appId } = req.params;
    const updates = req.body;

    const app = await MiniApp.findOne({ appId });
    if (!app) return res.status(404).json({ error: 'App not found' });
    if (app.developerId !== developerId) return res.status(403).json({ error: 'Forbidden' });

    // When developer submits an update, reset to under_review
    const allowedFields = ['name', 'description', 'shortDescription', 'icon', 'screenshots',
      'entryUrl', 'category', 'tags', 'permissions', 'version', 'supportsOffline', 'isPaid', 'price'];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) app[field] = updates[field];
    });
    app.status = 'under_review';

    await app.save();
    res.json({ status: 'success', data: app });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Admin: Approve or reject an app
 */
const reviewApp = async (req, res) => {
  try {
    const { appId } = req.params;
    const { status, rejectionReason, isFeatured, revenueSharePercent } = req.body;

    if (!['active', 'rejected', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const app = await MiniApp.findOneAndUpdate(
      { appId },
      {
        status,
        ...(rejectionReason ? { rejectionReason } : {}),
        ...(isFeatured !== undefined ? { isFeatured } : {}),
        ...(revenueSharePercent !== undefined ? { revenueSharePercent } : {}),
      },
      { new: true }
    );
    if (!app) return res.status(404).json({ error: 'App not found' });
    res.json({ status: 'success', data: app });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get developer's own apps
 */
const getMyApps = async (req, res) => {
  try {
    const developerId = req.headers['x-user-id'] || req.params.developerId;
    const apps = await MiniApp.find({ developerId }).sort({ createdAt: -1 });
    res.json({ status: 'success', data: apps });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// APP STORE / DISCOVERY
// ==========================================

const getApps = async (req, res) => {
  try {
    const { category, sort = 'popular', search, featured, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { status: 'active' };
    if (category && ALLOWED_CATEGORIES.includes(String(category))) query.category = String(category);
    if (featured === 'true') query.isFeatured = true;
    if (search && typeof search === 'string') {
      // Escape regex special characters to prevent regex injection
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').substring(0, 100);
      query.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } },
        { tags: { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    const safeSort = ALLOWED_SORT.includes(String(sort)) ? String(sort) : 'popular';
    let sortObj = {};
    if (safeSort === 'popular') sortObj = { installCount: -1 };
    else if (safeSort === 'rating') sortObj = { averageRating: -1 };
    else if (safeSort === 'newest') sortObj = { createdAt: -1 };

    const [apps, total] = await Promise.all([
      MiniApp.find(query).sort(sortObj).skip(skip).limit(parseInt(limit))
        .select('-reviews'),
      MiniApp.countDocuments(query),
    ]);

    res.json({ status: 'success', data: apps, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAppById = async (req, res) => {
  try {
    const miniApp = await MiniApp.findOne({ appId: req.params.appId });
    if (!miniApp) return res.status(404).json({ error: 'Mini app not found' });
    res.json({ status: 'success', data: miniApp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getFeaturedApps = async (req, res) => {
  try {
    const apps = await MiniApp.find({ status: 'active', isFeatured: true })
      .sort({ installCount: -1 })
      .limit(10)
      .select('-reviews');
    res.json({ status: 'success', data: apps });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// USER INSTALLS & PERMISSIONS
// ==========================================

/**
 * Install a mini app (record install, grant requested permissions)
 */
const installApp = async (req, res) => {
  try {
    const userId = sanitizeId(req.headers['x-user-id'] || req.body.userId);
    const appId = sanitizeId(req.params.appId);
    const grantedPermissions = Array.isArray(req.body.grantedPermissions)
      ? req.body.grantedPermissions.filter(p => ALLOWED_PERMISSIONS.includes(String(p)))
      : [];

    if (!userId || !appId) return res.status(400).json({ error: 'Invalid userId or appId' });

    const app = await MiniApp.findOne({ appId, status: 'active' });
    if (!app) return res.status(404).json({ error: 'App not found or not active' });

    // Validate that granted permissions are a subset of app's required permissions
    const invalid = grantedPermissions.filter(p => !app.permissions.includes(p));
    if (invalid.length > 0) {
      return res.status(400).json({ error: `Invalid permissions: ${invalid.join(', ')}` });
    }

    const install = await UserAppInstall.findOneAndUpdate(
      { userId, appId },
      { grantedPermissions, installedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await MiniApp.updateOne({ appId }, { $inc: { installCount: 1 } });

    res.status(200).json({ status: 'success', data: install });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Uninstall a mini app
 */
const uninstallApp = async (req, res) => {
  try {
    const userId = sanitizeId(req.headers['x-user-id'] || req.body.userId);
    const appId = sanitizeId(req.params.appId);
    if (!userId || !appId) return res.status(400).json({ error: 'Invalid userId or appId' });

    await UserAppInstall.deleteOne({ userId, appId });
    await MiniApp.updateOne({ appId }, { $inc: { installCount: -1 } });

    res.json({ status: 'success', message: 'App uninstalled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get all apps installed by a user
 */
const getInstalledApps = async (req, res) => {
  try {
    const userId = sanitizeId(req.headers['x-user-id'] || req.params.userId);
    if (!userId) return res.status(400).json({ error: 'Invalid userId' });

    const installs = await UserAppInstall.find({ userId }).sort({ lastOpenedAt: -1 });
    const appIds = installs.map(i => i.appId);
    const apps = await MiniApp.find({ appId: { $in: appIds } }).select('-reviews');

    // Merge install metadata
    const result = installs.map(install => {
      const app = apps.find(a => a.appId === install.appId);
      return { ...app?.toObject(), grantedPermissions: install.grantedPermissions, isFavorite: install.isFavorite, lastOpenedAt: install.lastOpenedAt, openCount: install.openCount };
    }).filter(item => item.appId);

    res.json({ status: 'success', data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Record an app open event (for analytics)
 */
const recordAppOpen = async (req, res) => {
  try {
    const userId = sanitizeId(req.headers['x-user-id'] || req.body.userId);
    const appId = sanitizeId(req.params.appId);
    if (!userId || !appId) return res.status(400).json({ error: 'Invalid userId or appId' });

    await UserAppInstall.updateOne(
      { userId, appId },
      { $inc: { openCount: 1 }, $set: { lastOpenedAt: new Date() } }
    );
    await MiniApp.updateOne({ appId }, { $inc: { activeUsers: 1 } });

    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Toggle favorite status for installed app
 */
const toggleFavorite = async (req, res) => {
  try {
    const userId = sanitizeId(req.headers['x-user-id'] || req.body.userId);
    const appId = sanitizeId(req.params.appId);
    if (!userId || !appId) return res.status(400).json({ error: 'Invalid userId or appId' });

    const install = await UserAppInstall.findOne({ userId, appId });
    if (!install) return res.status(404).json({ error: 'App not installed' });

    install.isFavorite = !install.isFavorite;
    await install.save();

    res.json({ status: 'success', data: { isFavorite: install.isFavorite } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// REVIEWS & RATINGS
// ==========================================

const addReview = async (req, res) => {
  try {
    const userId = sanitizeId(req.headers['x-user-id'] || req.body.userId);
    const appId = sanitizeId(req.params.appId);
    const rating = parseInt(req.body.rating, 10);
    const comment = req.body.comment ? String(req.body.comment).substring(0, 500) : '';

    if (!userId || !appId) return res.status(400).json({ error: 'Invalid userId or appId' });
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' });

    const app = await MiniApp.findOne({ appId });
    if (!app) return res.status(404).json({ error: 'App not found' });

    const install = await UserAppInstall.findOne({ userId, appId });
    if (!install) return res.status(400).json({ error: 'You must install the app before reviewing' });

    // Remove existing review from this user if any
    app.reviews = app.reviews.filter(r => r.userId !== userId);
    app.reviews.push({ userId, rating, comment });

    const totalRatings = app.reviews.length;
    const averageRating = app.reviews.reduce((sum, r) => sum + r.rating, 0) / totalRatings;

    app.totalRatings = totalRatings;
    app.averageRating = Math.round(averageRating * 10) / 10;

    await app.save();
    res.status(200).json({ status: 'success', data: { averageRating: app.averageRating, totalRatings: app.totalRatings } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getReviews = async (req, res) => {
  try {
    const appId = sanitizeId(req.params.appId);
    if (!appId) return res.status(400).json({ error: 'Invalid appId' });

    const app = await MiniApp.findOne({ appId }).select('reviews averageRating totalRatings');
    if (!app) return res.status(404).json({ error: 'App not found' });
    res.json({ status: 'success', data: { reviews: app.reviews, averageRating: app.averageRating, totalRatings: app.totalRatings } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// DEVELOPER ANALYTICS
// ==========================================

const getDeveloperAnalytics = async (req, res) => {
  try {
    const developerId = sanitizeId(req.headers['x-user-id'] || req.params.developerId);
    if (!developerId) return res.status(400).json({ error: 'Invalid developerId' });

    const apps = await MiniApp.find({ developerId });

    const analytics = {
      totalApps: apps.length,
      publishedApps: apps.filter(a => a.status === 'active').length,
      underReviewApps: apps.filter(a => a.status === 'under_review').length,
      totalInstalls: apps.reduce((sum, a) => sum + a.installCount, 0),
      totalRevenue: apps.reduce((sum, a) => sum + a.totalRevenue, 0),
      averageRating: apps.length
        ? Math.round((apps.reduce((sum, a) => sum + a.averageRating, 0) / apps.length) * 10) / 10
        : 0,
      apps: apps.map(a => ({
        appId: a.appId, name: a.name, status: a.status, installCount: a.installCount,
        averageRating: a.averageRating, totalRevenue: a.totalRevenue, category: a.category,
      })),
    };

    res.json({ status: 'success', data: analytics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Legacy – kept for backwards compat
const updateAppStatus = async (req, res) => {
  try {
    const { appId } = req.params;
    const { status } = req.body;
    const miniApp = await MiniApp.findOneAndUpdate({ appId }, { status }, { new: true });
    if (!miniApp) return res.status(404).json({ error: 'App not found' });
    res.json({ status: 'success', data: miniApp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export default {
  registerApp, updateApp, reviewApp, getMyApps,
  getApps, getAppById, getFeaturedApps,
  installApp, uninstallApp, getInstalledApps, recordAppOpen, toggleFavorite,
  addReview, getReviews,
  getDeveloperAnalytics,
  updateAppStatus,
};
