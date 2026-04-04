import express from 'express';
import * as groupController from '../controllers/groupController.js';

const router = express.Router();

router.post('/create', groupController.createGroup);
router.get('/user/:userId', groupController.getUserGroups);
router.get('/:groupId', groupController.getGroup);
router.patch('/:groupId/settings', groupController.updateGroupSettings);
router.patch('/:groupId/description', groupController.updateDescription);
router.post('/:groupId/members', groupController.addMembers);
router.delete('/:groupId/members/:userId', groupController.removeMember);
router.post('/:groupId/admin', groupController.makeAdmin);
router.delete('/:groupId/admin/:userId', groupController.removeAdmin);

// Messages
router.post('/:groupId/messages', groupController.sendGroupMessage);
router.get('/:groupId/messages', groupController.getGroupMessages);
router.get('/:groupId/pinned', groupController.getGroupPinnedMessages);
router.post('/:groupId/messages/:messageId/react', groupController.reactToGroupMessage);
router.delete('/:groupId/messages/:messageId', groupController.deleteGroupMessage);
router.post('/:groupId/messages/:messageId/pin', groupController.pinGroupMessage);

export default router;
