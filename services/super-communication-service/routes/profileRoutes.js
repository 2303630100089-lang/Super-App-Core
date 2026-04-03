import express from 'express';
import * as profileController from '../controllers/profileController.js';

const router = express.Router();

router.post('/', profileController.updateProfile);
router.get('/search', profileController.searchProfiles);
router.get('/:username', profileController.getProfileByUsername);
router.post('/follow', profileController.toggleFollow);
router.get('/:username/qr', profileController.generateProfileQR);
router.get('/:userId/followers', profileController.getFollowers);
router.get('/:userId/following', profileController.getFollowing);
router.get('/:userId/suggestions', profileController.getPeopleYouMayKnow);
router.get('/:userId/friends', profileController.getFriends);

export default router;
