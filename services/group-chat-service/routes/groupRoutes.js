import express from 'express';
import { createGroup, getGroupDetails, getUserGroups, updateGroup, addMember, removeMember, leaveGroup, makeAdmin, joinByInvite, sendMessage, getMessages, deleteMessage, reactToMessage, pinMessage, votePoll, searchMessages, editMessage, unpinMessage, getPinnedMessages, muteMember, unmuteMember, banMember, unbanMember, getPublicGroups, getScheduledMessages } from '../controllers/groupController.js';

const router = express.Router();

// Discovery
router.get('/public', getPublicGroups);

// Group management
router.post('/', createGroup);
router.get('/user/:userId', getUserGroups);
router.get('/:groupId', getGroupDetails);
router.put('/:groupId', updateGroup);
router.post('/:groupId/members', addMember);
router.delete('/:groupId/members', removeMember);
router.post('/:groupId/leave', leaveGroup);
router.post('/:groupId/admin', makeAdmin);
router.post('/join-invite', joinByInvite);

// Moderation
router.post('/:groupId/mute', muteMember);
router.post('/:groupId/unmute', unmuteMember);
router.post('/:groupId/ban', banMember);
router.post('/:groupId/unban', unbanMember);

// Messages
router.post('/messages', sendMessage);
router.get('/messages/:groupId', getMessages);
router.get('/messages/:groupId/search', searchMessages);
router.get('/messages/:groupId/scheduled', getScheduledMessages);
router.get('/messages/:groupId/pinned', getPinnedMessages);
router.delete('/messages/:messageId', deleteMessage);
router.patch('/messages/:messageId', editMessage);
router.post('/messages/:messageId/react', reactToMessage);
router.post('/messages/:messageId/pin', pinMessage);
router.delete('/messages/:messageId/pin', unpinMessage);
router.post('/messages/:messageId/poll/vote', votePoll);

export default router;
