import express from 'express';
import * as activityController from '../controllers/activityController.js';
import * as recommendationController from '../controllers/recommendationController.js';
import * as searchHistoryController from '../controllers/searchHistoryController.js';

const router = express.Router();

// Activity logging
router.post('/activity', activityController.logActivity);
router.post('/activity/batch', activityController.logActivityBatch);

// Activity history
router.get('/activity/:userId', activityController.getUserActivity);
router.get('/activity/:userId/ride-history', activityController.getRideHistory);
router.get('/activity/:userId/order-history', activityController.getOrderHistory);
router.get('/activity/:userId/product-history', activityController.getProductHistory);

// Recommendations
router.get('/recommendations/:userId', recommendationController.getRecommendations);
router.get('/recommendations/:userId/feed', recommendationController.getPersonalisedFeedSignal);

// Search history
router.post('/search-history', searchHistoryController.saveSearch);
router.get('/search-history/:userId', searchHistoryController.getSearchHistory);
router.delete('/search-history/:userId', searchHistoryController.clearSearchHistory);

export default router;
