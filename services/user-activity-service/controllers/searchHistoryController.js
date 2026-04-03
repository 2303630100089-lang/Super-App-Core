import SearchHistory from '../models/SearchHistory.js';

// POST /search-history  – save a search query for a user
export const saveSearch = async (req, res) => {
  try {
    const { userId, query, category, resultsCount } = req.body;
    if (!userId || !query) {
      return res.status(400).json({ status: 'fail', message: 'userId and query are required' });
    }
    const entry = new SearchHistory({ userId, query, category, resultsCount });
    await entry.save();
    res.status(201).json({ status: 'success', data: entry });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// GET /search-history/:userId  – paginated search history
export const getSearchHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [history, total] = await Promise.all([
      SearchHistory.find({ userId }).sort({ timestamp: -1 }).skip(skip).limit(parseInt(limit)),
      SearchHistory.countDocuments({ userId }),
    ]);

    res.json({
      status: 'success',
      data: history,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// DELETE /search-history/:userId  – clear all search history for a user
export const clearSearchHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    await SearchHistory.deleteMany({ userId });
    res.json({ status: 'success', message: 'Search history cleared' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
