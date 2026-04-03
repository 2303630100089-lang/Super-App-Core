import UserActivity from '../models/UserActivity.js';

// POST /activity  – log a user activity event
export const logActivity = async (req, res) => {
  try {
    const activity = new UserActivity(req.body);
    await activity.save();
    res.status(201).json({ status: 'success', data: activity });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
};

// POST /activity/batch  – log multiple events in one call
export const logActivityBatch = async (req, res) => {
  try {
    const { activities } = req.body;
    if (!Array.isArray(activities) || activities.length === 0) {
      return res.status(400).json({ status: 'fail', message: 'activities array required' });
    }
    const result = await UserActivity.insertMany(activities, { ordered: false });
    res.status(201).json({ status: 'success', inserted: result.length });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// GET /activity/:userId  – paginated raw history for a user
export const getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const { serviceType, activityType, from, to, page = 1, limit = 50 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));

    const filter = { userId };
    if (serviceType) filter.serviceType = serviceType;
    if (activityType) filter.activityType = activityType;
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    const skip = (pageNum - 1) * limitNum;
    const [activities, total] = await Promise.all([
      UserActivity.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limitNum),
      UserActivity.countDocuments(filter),
    ]);

    res.json({
      status: 'success',
      data: activities,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// GET /activity/:userId/ride-history  – past rides
export const getRideHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const rides = await UserActivity.find({ userId, serviceType: 'ride' })
      .sort({ timestamp: -1 })
      .limit(20);
    res.json({ status: 'success', data: rides });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// GET /activity/:userId/order-history  – past food + e-commerce orders
export const getOrderHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await UserActivity.find({
      userId,
      serviceType: { $in: ['food', 'order'] },
      activityType: { $in: ['food_ordered', 'food_delivered', 'order_placed', 'order_delivered'] },
    }).sort({ timestamp: -1 }).limit(30);
    res.json({ status: 'success', data: orders });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// GET /activity/:userId/product-history  – viewed / wishlisted products
export const getProductHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const products = await UserActivity.find({
      userId,
      serviceType: { $in: ['marketplace', 'order'] },
      activityType: { $in: ['product_viewed', 'product_wishlist', 'listing_viewed', 'listing_created', 'bid_placed'] },
    }).sort({ timestamp: -1 }).limit(30);
    res.json({ status: 'success', data: products });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
