import express from 'express';
import * as liveController from '../controllers/liveController.js';

const router = express.Router();

router.get('/', liveController.getStreams);
router.post('/start', liveController.startStream);
router.post('/:streamId/end', liveController.endStream);
router.post('/:streamId/join', liveController.joinStream);
router.post('/:streamId/leave', liveController.leaveStream);

export default router;
