import axios from 'axios';
import SearchHistory from '../models/SearchHistory.js';

const globalSearch = async (req, res) => {
  try {
    const { q, category, userId } = req.query;
    const authHeader = req.headers['authorization'];
    const headers = { Authorization: authHeader };

    const searchTasks = [];

    if (!category || category === 'users') {
      searchTasks.push(axios.get(`${process.env.USER_SERVICE_URL}/profile/${q}`, { headers }).catch(() => null));
    }
    if (!category || category === 'posts') {
      searchTasks.push(axios.get(`${process.env.SOCIAL_SERVICE_URL}/explore?hashtag=${q}`, { headers }).catch(() => null));
    }
    if (!category || category === 'marketplace') {
      searchTasks.push(axios.get(`${process.env.ADVANCED_MARKETPLACE_SERVICE_URL}/listings?search=${q}`, { headers }).catch(() => null));
    }
    if (!category || category === 'hotels') {
      searchTasks.push(axios.get(`${process.env.HOTEL_SERVICE_URL}/search?q=${q}`, { headers }).catch(() => null));
    }
    if (!category || category === 'restaurants') {
      searchTasks.push(axios.get(`${process.env.FOOD_SERVICE_URL}/restaurants?search=${q}`, { headers }).catch(() => null));
    }
    if (!category || category === 'jobs') {
      searchTasks.push(axios.get(`${process.env.PROFESSIONAL_SERVICE_URL}/jobs?q=${q}`, { headers }).catch(() => null));
    }

    const results = await Promise.all(searchTasks);

    const response = {
      users: results[0] ? (results[0].data.data || results[0].data) : [],
      posts: results[1] ? (results[1].data.data || results[1].data) : [],
      marketplace: results[2] ? (results[2].data.data || results[2].data) : [],
      hotels: results[3] ? (results[3].data.data || results[3].data) : [],
      restaurants: results[4] ? (results[4].data.data || results[4].data) : [],
      jobs: results[5] ? (results[5].data.data || results[5].data) : [],
    };

    // Persist search query for authenticated users (fire-and-forget)
    if (userId && q) {
      SearchHistory.create({ userId, query: q, category: category || 'all' }).catch(() => {});
    }

    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTrending = async (req, res) => {
  try {
    const headers = { Authorization: req.headers['authorization'] };
    const socialRes = await axios.get(`${process.env.SOCIAL_SERVICE_URL}/explore`, { headers });
    res.json(socialRes.data.slice(0, 10));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /history/:userId – return recent search queries
const getSearchHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;
    const history = await SearchHistory.find({ userId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .select('query category timestamp');
    res.json({ status: 'success', data: history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /history/:userId – clear search history
const clearSearchHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    await SearchHistory.deleteMany({ userId });
    res.json({ status: 'success', message: 'Search history cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export default { globalSearch, getTrending, getSearchHistory, clearSearchHistory };
