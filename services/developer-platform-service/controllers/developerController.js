import DeveloperAccount from '../models/DeveloperAccount.js';
import SdkEvent from '../models/SdkEvent.js';
import crypto from 'crypto';

// ==========================================
// INPUT SANITIZATION
// ==========================================

const sanitizeId = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return null; // reject NoSQL injection objects
  return String(value);
};

const ALLOWED_EVENT_TYPES = ['app_open', 'app_close', 'page_view', 'button_click', 'purchase', 'payment_request', 'share', 'error'];

// ==========================================
// DEVELOPER REGISTRATION & PROFILE
// ==========================================

export const registerDeveloper = async (req, res) => {
  try {
    const userId = sanitizeId(req.headers['x-user-id'] || req.body.userId);
    const { displayName, email, website, description, agreedToTerms } = req.body;

    if (!userId) return res.status(400).json({ error: 'Invalid userId' });
    if (!agreedToTerms) {
      return res.status(400).json({ error: 'You must agree to the Developer Terms of Service' });
    }

    let account = await DeveloperAccount.findOne({ userId });
    if (account) return res.status(200).json({ status: 'success', data: account, message: 'Already registered' });

    // Generate API credentials
    const apiKey = `sk_live_${crypto.randomBytes(24).toString('hex')}`;
    const apiSecret = crypto.randomBytes(32).toString('hex');

    account = new DeveloperAccount({
      userId, displayName, email, website, description,
      apiKey,
      apiSecret: crypto.createHash('sha256').update(apiSecret).digest('hex'), // store hashed
      agreedToTerms: true,
      agreedToTermsAt: new Date(),
      status: 'pending',
    });
    await account.save();

    // Return the raw secret only once on registration
    res.status(201).json({
      status: 'success',
      data: { ...account.toObject(), apiSecret },
      message: 'Developer account created. Save your API secret – it will not be shown again.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getDeveloperProfile = async (req, res) => {
  try {
    const userId = sanitizeId(req.headers['x-user-id'] || req.params.userId);
    if (!userId) return res.status(400).json({ error: 'Invalid userId' });
    const account = await DeveloperAccount.findOne({ userId }).select('-apiSecret');
    if (!account) return res.status(404).json({ error: 'Developer account not found' });
    res.json({ status: 'success', data: account });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateDeveloperProfile = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { displayName, website, description, avatarUrl, payoutUpiId } = req.body;

    const account = await DeveloperAccount.findOneAndUpdate(
      { userId },
      { displayName, website, description, avatarUrl, payoutUpiId },
      { new: true }
    ).select('-apiSecret');

    if (!account) return res.status(404).json({ error: 'Developer account not found' });
    res.json({ status: 'success', data: account });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const regenerateApiKey = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const newApiKey = `sk_live_${crypto.randomBytes(24).toString('hex')}`;
    const newApiSecret = crypto.randomBytes(32).toString('hex');

    const account = await DeveloperAccount.findOneAndUpdate(
      { userId },
      {
        apiKey: newApiKey,
        apiSecret: crypto.createHash('sha256').update(newApiSecret).digest('hex'),
      },
      { new: true }
    ).select('-apiSecret');

    if (!account) return res.status(404).json({ error: 'Developer account not found' });

    res.json({
      status: 'success',
      data: { ...account.toObject(), apiKey: newApiKey, apiSecret: newApiSecret },
      message: 'API credentials regenerated. Save your new secret – it will not be shown again.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// SDK ANALYTICS
// ==========================================

export const trackEvent = async (req, res) => {
  try {
    const appId = sanitizeId(req.body.appId);
    const developerId = sanitizeId(req.body.developerId);
    const userId = sanitizeId(req.body.userId || req.headers['x-user-id']);
    const eventType = req.body.eventType && ALLOWED_EVENT_TYPES.includes(String(req.body.eventType))
      ? String(req.body.eventType) : null;

    if (!appId || !developerId || !eventType) {
      return res.status(400).json({ error: 'appId, developerId, and valid eventType are required' });
    }

    const { sessionId, deviceType, country } = req.body;
    const allowedDeviceTypes = ['mobile', 'tablet', 'desktop'];
    const safeDeviceType = deviceType && allowedDeviceTypes.includes(String(deviceType)) ? String(deviceType) : 'mobile';

    const event = new SdkEvent({
      appId, developerId, userId,
      eventType,
      payload: req.body.payload && typeof req.body.payload === 'object' ? req.body.payload : {},
      sessionId: sessionId ? String(sessionId).substring(0, 64) : undefined,
      deviceType: safeDeviceType,
      country: country ? String(country).substring(0, 2) : undefined,
    });
    await event.save();

    res.status(201).json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAppAnalytics = async (req, res) => {
  try {
    const developerId = sanitizeId(req.headers['x-user-id']);
    const appId = sanitizeId(req.params.appId);
    if (!developerId || !appId) return res.status(400).json({ error: 'Invalid parameters' });

    const days = Math.min(Math.max(parseInt(req.query.days) || 7, 1), 90);

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [eventCounts, uniqueUsers, recentEvents] = await Promise.all([
      SdkEvent.aggregate([
        { $match: { appId, developerId, timestamp: { $gte: since } } },
        { $group: { _id: '$eventType', count: { $sum: 1 } } },
      ]),
      SdkEvent.distinct('userId', { appId, developerId, timestamp: { $gte: since } }),
      SdkEvent.find({ appId, developerId })
        .sort({ timestamp: -1 })
        .limit(50)
        .select('eventType userId timestamp payload'),
    ]);

    const analytics = {
      appId,
      periodDays: parseInt(days),
      uniqueUsers: uniqueUsers.length,
      eventBreakdown: eventCounts.reduce((acc, e) => { acc[e._id] = e.count; return acc; }, {}),
      totalEvents: eventCounts.reduce((sum, e) => sum + e.count, 0),
      recentEvents,
    };

    res.json({ status: 'success', data: analytics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getDeveloperDashboard = async (req, res) => {
  try {
    const developerId = sanitizeId(req.headers['x-user-id']);
    if (!developerId) return res.status(400).json({ error: 'Unauthorized' });
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days

    const account = await DeveloperAccount.findOne({ userId: developerId }).select('-apiSecret');
    if (!account) return res.status(404).json({ error: 'Developer account not found' });

    const [eventCount, uniqueUserCount, purchaseEvents] = await Promise.all([
      SdkEvent.countDocuments({ developerId, timestamp: { $gte: since } }),
      SdkEvent.distinct('userId', { developerId, timestamp: { $gte: since } }),
      SdkEvent.find({ developerId, eventType: 'purchase', timestamp: { $gte: since } }),
    ]);

    const revenue = purchaseEvents.reduce((sum, e) => sum + (e.payload?.amount || 0), 0);

    res.json({
      status: 'success',
      data: {
        account,
        last30Days: {
          totalEvents: eventCount,
          uniqueUsers: uniqueUserCount.length,
          revenue,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// SDK DOCUMENTATION ENDPOINT
// ==========================================

export const getSdkInfo = async (req, res) => {
  res.json({
    status: 'success',
    data: {
      sdkVersion: '1.0.0',
      supportedPermissions: ['location', 'camera', 'microphone', 'contacts', 'storage', 'notifications', 'payments', 'identity'],
      supportedCategories: ['utility', 'social', 'entertainment', 'shopping', 'productivity', 'finance', 'travel', 'health', 'education', 'games'],
      revenueShare: { developer: '70%', platform: '30%' },
      apiEndpoints: {
        trackEvent: 'POST /api/developer/sdk/events',
        getUserContext: 'GET /api/mini-apps/api/context/:appId',
        requestPayment: 'POST /api/mini-apps/api/payment/request',
        sendNotification: 'POST /api/mini-apps/api/notify',
      },
      documentation: 'https://developers.superapp.io/mini-apps',
    },
  });
};
