import express from 'express';
import { 
  createChannel, getUserChannels, subscribeToChannel, unsubscribeFromChannel, getChannel, 
  updateChannelSettings, sendChannelMessage, getChannelMessages, 
  addAdmin, addMembers, pinMessage, unpinMessage, getPinnedMessages,
  createThread, getChannelThreads, updatePermissions,
  editChannelMessage, deleteChannelMessage, reactToChannelMessage,
  recordMessageView, getChannelAnalytics, exploreChannels, getScheduledPosts
} from '../controllers/channelController.js';

const router = express.Router();

// Discovery
router.get('/explore', exploreChannels);

router.post('/', createChannel);
router.get('/user/:userId', getUserChannels);
router.post('/subscribe', subscribeToChannel);
router.post('/unsubscribe', unsubscribeFromChannel);
router.get('/:channelId', getChannel);
router.put('/:channelId', updateChannelSettings);
router.post('/:channelId/messages', sendChannelMessage);
router.get('/:channelId/messages', getChannelMessages);
router.get('/:channelId/messages/scheduled', getScheduledPosts);
router.post('/:channelId/admin', addAdmin);
router.post('/:channelId/members', addMembers);

// Analytics
router.get('/:channelId/analytics', getChannelAnalytics);

// Pinned messages
router.post('/:channelId/messages/:messageId/pin', pinMessage);
router.delete('/:channelId/messages/:messageId/pin', unpinMessage);
router.get('/:channelId/pinned', getPinnedMessages);

// Message actions
router.patch('/:channelId/messages/:messageId', editChannelMessage);
router.delete('/:channelId/messages/:messageId', deleteChannelMessage);
router.post('/:channelId/messages/:messageId/react', reactToChannelMessage);
router.post('/:channelId/messages/:messageId/view', recordMessageView);

// Thread support
router.post('/:channelId/messages/:messageId/thread', createThread);
router.get('/:channelId/threads', getChannelThreads);

// Permissions
router.put('/:channelId/permissions', updatePermissions);

export default router;
