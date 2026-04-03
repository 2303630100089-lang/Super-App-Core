import UserActivity from '../models/UserActivity.js';
import SearchHistory from '../models/SearchHistory.js';

// GET /recommendations/:userId
// Returns personalised content buckets derived from the user's recent activity.
export const getRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;

    // Analyse the last 90 days of activity
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const [activityStats, recentSearches, recentRides, recentOrders] = await Promise.all([
      // Aggregate activity counts per service type
      UserActivity.aggregate([
        { $match: { userId, timestamp: { $gte: since } } },
        { $group: { _id: '$serviceType', count: { $sum: 1 }, categories: { $addToSet: '$category' } } },
        { $sort: { count: -1 } },
      ]),
      // Last 10 searches
      SearchHistory.find({ userId }).sort({ timestamp: -1 }).limit(10).select('query category'),
      // Last 3 rides for "repeat destination" suggestions
      UserActivity.find({ userId, serviceType: 'ride', activityType: { $in: ['ride_booked', 'ride_completed'] } })
        .sort({ timestamp: -1 }).limit(3).select('metadata'),
      // Last 5 orders for repeat-order suggestions
      UserActivity.find({ userId, serviceType: { $in: ['food', 'order'] }, activityType: { $in: ['food_ordered', 'order_placed'] } })
        .sort({ timestamp: -1 }).limit(5).select('metadata'),
    ]);

    // Build service preference ranking (most-used services first)
    const servicePreferences = activityStats.map(s => ({
      service: s._id,
      usageCount: s.count,
      categories: s.categories.filter(Boolean),
    }));

    // Top search terms
    const topSearches = recentSearches.map(s => s.query);

    // Suggested ride destinations (from past rides)
    const suggestedDestinations = recentRides
      .map(r => r.metadata?.dropLocation || r.metadata?.destination)
      .filter(Boolean);

    // Repeat order suggestions
    const repeatOrderSuggestions = recentOrders
      .map(o => ({
        name: o.metadata?.restaurantName || o.metadata?.productName || o.metadata?.itemName,
        serviceType: o.metadata?.serviceType,
        id: o.metadata?.itemId || o.metadata?.restaurantId || o.metadata?.productId,
      }))
      .filter(s => s.name);

    res.json({
      status: 'success',
      data: {
        servicePreferences,
        topSearches,
        suggestedDestinations,
        repeatOrderSuggestions,
      },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// GET /recommendations/:userId/feed
// Returns a merged personalised feed signal – which content types to surface.
export const getPersonalisedFeedSignal = async (req, res) => {
  try {
    const { userId } = req.params;
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [activityBreakdown, topCategories, recentSearches] = await Promise.all([
      UserActivity.aggregate([
        { $match: { userId, timestamp: { $gte: since } } },
        { $group: { _id: '$serviceType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      UserActivity.aggregate([
        { $match: { userId, category: { $ne: null }, timestamp: { $gte: since } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      SearchHistory.find({ userId }).sort({ timestamp: -1 }).limit(5).select('query'),
    ]);

    res.json({
      status: 'success',
      data: {
        preferredServices: activityBreakdown.map(a => a._id),
        preferredCategories: topCategories.map(c => c._id),
        recentSearchTerms: recentSearches.map(s => s.query),
      },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
