import express from 'express';
import profileController from '../controllers/profileController.js';
import connectionController from '../controllers/connectionController.js';
import jobController from '../controllers/jobController.js';
import * as codingController from '../controllers/codingController.js';

const router = express.Router();

// Profiles
router.post('/profile', profileController.updateProfile);
router.get('/profile/:userId', profileController.getProfile);

// Connections
router.post('/connect', connectionController.sendRequest);
router.post('/connect/respond', connectionController.respondToRequest);
router.get('/connections/:userId', connectionController.getConnections);

// Jobs
router.post('/jobs', jobController.postJob);
router.get('/jobs', jobController.getJobs);
router.post('/jobs/apply', jobController.applyToJob);
router.get('/jobs/:jobId/applications', jobController.getApplications);

// Coding Hub
router.get('/coding-topics', codingController.getCodingTopics);
router.get('/coding-discussions', codingController.getDiscussions);
router.post('/coding-discussions', codingController.createDiscussion);
router.post('/coding-discussions/:discussionId/like', codingController.likeDiscussion);

export default router;
