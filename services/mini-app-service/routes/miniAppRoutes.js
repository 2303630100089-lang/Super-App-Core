import express from 'express';
import miniAppController from '../controllers/miniAppController.js';
import internalApiController from '../controllers/internalApiController.js';

const router = express.Router();

// ==========================================
// APP STORE / DISCOVERY
// ==========================================
router.get('/store', miniAppController.getApps);
router.get('/store/featured', miniAppController.getFeaturedApps);
router.get('/store/:appId', miniAppController.getAppById);

// ==========================================
// DEVELOPER PLATFORM
// ==========================================
router.post('/developer/register', miniAppController.registerApp);
router.put('/developer/:appId', miniAppController.updateApp);
router.get('/developer/apps', miniAppController.getMyApps);
router.get('/developer/analytics', miniAppController.getDeveloperAnalytics);

// Admin: app review
router.patch('/admin/:appId/review', miniAppController.reviewApp);

// Legacy registry routes (backwards compat)
router.post('/registry', miniAppController.registerApp);
router.get('/registry', miniAppController.getApps);
router.get('/registry/:appId', miniAppController.getAppById);
router.patch('/registry/:appId/status', miniAppController.updateAppStatus);

// ==========================================
// USER INSTALL / PERMISSION MANAGEMENT
// ==========================================
router.post('/user/install/:appId', miniAppController.installApp);
router.delete('/user/install/:appId', miniAppController.uninstallApp);
router.get('/user/installed', miniAppController.getInstalledApps);
router.post('/user/open/:appId', miniAppController.recordAppOpen);
router.post('/user/favorite/:appId', miniAppController.toggleFavorite);

// ==========================================
// REVIEWS
// ==========================================
router.post('/:appId/reviews', miniAppController.addReview);
router.get('/:appId/reviews', miniAppController.getReviews);

// ==========================================
// INTERNAL API BRIDGE (for mini apps)
// ==========================================
router.get('/api/context/:appId', internalApiController.getUserContext);
router.post('/api/notify', internalApiController.notify);
router.post('/api/payment/request', internalApiController.requestPayment);

export default router;
