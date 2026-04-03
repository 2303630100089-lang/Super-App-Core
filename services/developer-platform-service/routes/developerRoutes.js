import express from 'express';
import * as developerController from '../controllers/developerController.js';

const router = express.Router();

// SDK Info / Documentation
router.get('/sdk/info', developerController.getSdkInfo);

// Developer Registration & Profile
router.post('/register', developerController.registerDeveloper);
router.get('/profile', developerController.getDeveloperProfile);
router.put('/profile', developerController.updateDeveloperProfile);
router.post('/api-key/regenerate', developerController.regenerateApiKey);

// SDK Analytics
router.post('/sdk/events', developerController.trackEvent);
router.get('/analytics/:appId', developerController.getAppAnalytics);
router.get('/dashboard', developerController.getDeveloperDashboard);

export default router;
