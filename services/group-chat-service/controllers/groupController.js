import Group from '../models/Group.js';
import GroupMessage from '../models/Message.js';
import crypto from 'crypto';

export const createGroup = async (req, res) => {
  try {
    const { name, description, createdBy, createdByName, avatar, memberIds } = req.body;
    const inviteLink = crypto.randomBytes(8).toString('hex');
    const members = [{ userId: createdBy, userName: createdByName, role: 'admin' }, ...(memberIds || []).map(m => ({ userId: m.userId, userName: m.userName, role: 'member' }))];
    
    const group = new Group({ name, description, createdBy, avatar, admins: [createdBy], members, memberCount: members.length, inviteLink });
    await group.save();

    // System message
    const sysMsg = new GroupMessage({ groupId: group._id, senderId: 'system', senderName: 'System', type: 'system', content: `${createdByName} created group "${name}"` });
    await sysMsg.save();

    res.status(201).json({ status: 'success', data: group });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getGroupDetails = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json({ status: 'success', data: group });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUserGroups = async (req, res) => {
  try {
    const groups = await Group.find({ 'members.userId': req.params.userId, isArchived: false }).sort({ 'lastMessage.timestamp': -1 });
    res.json({ status: 'success', data: groups });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateGroup = async (req, res) => {
  try {
    const group = await Group.findByIdAndUpdate(req.params.groupId, req.body, { new: true });
    res.json({ status: 'success', data: group });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const addMember = async (req, res) => {
  try {
    const { userId, userName, avatar, addedBy } = req.body;
    const group = await Group.findById(req.params.groupId);
    if (group.members.some(m => m.userId === userId)) return res.status(400).json({ error: 'Already a member' });
    if (group.members.length >= group.settings.maxMembers) return res.status(400).json({ error: 'Group is full' });
    
    group.members.push({ userId, userName, avatar, role: 'member' });
    group.memberCount += 1;
    await group.save();

    await new GroupMessage({ groupId: group._id, senderId: 'system', senderName: 'System', type: 'system', content: `${addedBy} added ${userName}` }).save();
    res.json({ status: 'success', data: group });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const removeMember = async (req, res) => {
  try {
    const { userId, removedBy } = req.body;
    const group = await Group.findById(req.params.groupId);
    const removed = group.members.find(m => m.userId === userId);
    group.members = group.members.filter(m => m.userId !== userId);
    group.admins = group.admins.filter(a => a !== userId);
    group.memberCount = Math.max(0, group.memberCount - 1);
    await group.save();

    await new GroupMessage({ groupId: group._id, senderId: 'system', senderName: 'System', type: 'system', content: `${removedBy} removed ${removed?.userName || userId}` }).save();
    res.json({ status: 'success', message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const { userId, userName } = req.body;
    const group = await Group.findById(req.params.groupId);
    group.members = group.members.filter(m => m.userId !== userId);
    group.admins = group.admins.filter(a => a !== userId);
    group.memberCount = Math.max(0, group.memberCount - 1);
    if (group.admins.length === 0 && group.members.length > 0) {
      group.admins.push(group.members[0].userId);
      group.members[0].role = 'admin';
    }
    await group.save();
    await new GroupMessage({ groupId: group._id, senderId: 'system', senderName: 'System', type: 'system', content: `${userName} left the group` }).save();
    res.json({ status: 'success', message: 'Left group' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const makeAdmin = async (req, res) => {
  try {
    const { userId } = req.body;
    const group = await Group.findById(req.params.groupId);
    if (!group.admins.includes(userId)) group.admins.push(userId);
    const member = group.members.find(m => m.userId === userId);
    if (member) member.role = 'admin';
    await group.save();
    res.json({ status: 'success', message: 'Made admin' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const joinByInvite = async (req, res) => {
  try {
    const { inviteLink, userId, userName, avatar } = req.body;
    const group = await Group.findOne({ inviteLink });
    if (!group) return res.status(404).json({ error: 'Invalid invite link' });
    if (group.members.some(m => m.userId === userId)) return res.status(400).json({ error: 'Already a member' });
    if (group.members.length >= group.settings.maxMembers) return res.status(400).json({ error: 'Group is full' });

    group.members.push({ userId, userName, avatar, role: 'member' });
    group.memberCount += 1;
    await group.save();
    res.json({ status: 'success', data: group });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Messages
export const sendMessage = async (req, res) => {
  try {
    const { groupId, senderId, scheduledAt } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    // Enforce slow mode (skip for admins and system)
    const slowMode = group.settings?.slowModeSeconds || 0;
    if (slowMode > 0 && senderId !== 'system' && !group.admins.includes(senderId)) {
      const lastMsg = await GroupMessage.findOne({ groupId, senderId, isSent: true }).sort({ createdAt: -1 });
      if (lastMsg) {
        const secondsSinceLast = (Date.now() - new Date(lastMsg.createdAt).getTime()) / 1000;
        if (secondsSinceLast < slowMode) {
          const waitSecs = Math.ceil(slowMode - secondsSinceLast);
          return res.status(429).json({ error: `Slow mode: wait ${waitSecs}s before sending again` });
        }
      }
    }

    // Enforce onlyAdminsCanPost
    if (group.settings?.onlyAdminsCanPost && !group.admins.includes(senderId) && senderId !== 'system') {
      return res.status(403).json({ error: 'Only admins can send messages in this group' });
    }

    // Check if sender is banned
    if (group.banned?.includes(senderId)) {
      return res.status(403).json({ error: 'You are banned from this group' });
    }

    // Check if sender is muted
    const memberEntry = group.members.find(m => m.userId === senderId);
    if (memberEntry?.isMuted) {
      if (!memberEntry.mutedUntil || new Date(memberEntry.mutedUntil) > new Date()) {
        return res.status(403).json({ error: 'You are muted in this group' });
      }
    }

    const isSent = !scheduledAt || new Date(scheduledAt) <= new Date();
    const disappearingSeconds = group.settings?.disappearingMessages || 0;
    const expiresAt = disappearingSeconds > 0 && isSent
      ? new Date(Date.now() + disappearingSeconds * 1000)
      : undefined;

    const msg = new GroupMessage({ ...req.body, isSent, expiresAt });
    await msg.save();

    if (isSent) {
      await Group.findByIdAndUpdate(groupId, {
        lastMessage: { content: msg.content || `[${msg.type}]`, senderId: msg.senderId, senderName: msg.senderName, timestamp: new Date() }
      });
    }

    res.status(201).json({ status: 'success', data: msg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { before, limit = 50 } = req.query;
    const filter = { groupId: req.params.groupId, isDeleted: false };
    if (before) filter.createdAt = { $lt: new Date(before) };

    const messages = await GroupMessage.find(filter).sort({ createdAt: -1 }).limit(parseInt(limit)).populate('replyTo');
    res.json({ status: 'success', data: messages.reverse() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { forEveryone } = req.body;
    const update = forEveryone ? { deletedForEveryone: true, isDeleted: true, content: 'This message was deleted' } : { isDeleted: true };
    await GroupMessage.findByIdAndUpdate(req.params.messageId, update);
    res.json({ status: 'success', message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const reactToMessage = async (req, res) => {
  try {
    const { userId, emoji } = req.body;
    const msg = await GroupMessage.findById(req.params.messageId);
    const existing = msg.reactions.findIndex(r => r.userId === userId);
    if (existing > -1) msg.reactions.splice(existing, 1);
    if (emoji) msg.reactions.push({ userId, emoji });
    await msg.save();
    res.json({ status: 'success', data: msg.reactions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const pinMessage = async (req, res) => {
  try {
    await GroupMessage.findByIdAndUpdate(req.params.messageId, { isPinned: true });
    await Group.findByIdAndUpdate(req.body.groupId, { $addToSet: { pinnedMessages: req.params.messageId } });
    res.json({ status: 'success', message: 'Message pinned' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const votePoll = async (req, res) => {
  try {
    const { userId, optionIndex } = req.body;
    const msg = await GroupMessage.findById(req.params.messageId);
    if (!msg || msg.type !== 'poll') return res.status(400).json({ error: 'Not a poll' });
    
    if (!msg.poll.multipleChoice) {
      msg.poll.options.forEach(opt => { opt.voters = opt.voters.filter(v => v !== userId); });
    }
    if (msg.poll.options[optionIndex]) {
      const idx = msg.poll.options[optionIndex].voters.indexOf(userId);
      if (idx > -1) msg.poll.options[optionIndex].voters.splice(idx, 1);
      else msg.poll.options[optionIndex].voters.push(userId);
    }
    await msg.save();
    res.json({ status: 'success', data: msg.poll });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const searchMessages = async (req, res) => {
  try {
    const { q } = req.query;
    const messages = await GroupMessage.find({ groupId: req.params.groupId, content: new RegExp(q, 'i'), isDeleted: false }).sort({ createdAt: -1 }).limit(50);
    res.json({ status: 'success', data: messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { content, userId } = req.body;
    const msg = await GroupMessage.findById(req.params.messageId);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    if (msg.senderId !== userId) return res.status(403).json({ error: 'Cannot edit another user\'s message' });
    msg.content = content;
    msg.isEdited = true;
    msg.editedAt = new Date();
    await msg.save();
    res.json({ status: 'success', data: msg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const unpinMessage = async (req, res) => {
  try {
    await GroupMessage.findByIdAndUpdate(req.params.messageId, { isPinned: false });
    await Group.findByIdAndUpdate(req.body.groupId, { $pull: { pinnedMessages: req.params.messageId } });
    res.json({ status: 'success', message: 'Message unpinned' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getPinnedMessages = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    const messages = await GroupMessage.find({ _id: { $in: group.pinnedMessages }, isDeleted: false });
    res.json({ status: 'success', data: messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const muteMember = async (req, res) => {
  try {
    const { userId, muteDurationSeconds } = req.body;
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    const member = group.members.find(m => m.userId === userId);
    if (!member) return res.status(404).json({ error: 'Member not found' });
    member.isMuted = true;
    member.mutedUntil = muteDurationSeconds ? new Date(Date.now() + muteDurationSeconds * 1000) : null;
    await group.save();
    await new GroupMessage({ groupId: group._id, senderId: 'system', senderName: 'System', type: 'system', content: `${member.userName || userId} was muted` }).save();
    res.json({ status: 'success', message: 'Member muted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const unmuteMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    const member = group.members.find(m => m.userId === userId);
    if (!member) return res.status(404).json({ error: 'Member not found' });
    member.isMuted = false;
    member.mutedUntil = null;
    await group.save();
    res.json({ status: 'success', message: 'Member unmuted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const banMember = async (req, res) => {
  try {
    const { userId, bannedBy } = req.body;
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    const member = group.members.find(m => m.userId === userId);
    group.members = group.members.filter(m => m.userId !== userId);
    group.admins = group.admins.filter(a => a !== userId);
    group.memberCount = Math.max(0, group.memberCount - 1);
    if (!group.banned) group.banned = [];
    if (!group.banned.includes(userId)) group.banned.push(userId);
    await group.save();
    await new GroupMessage({ groupId: group._id, senderId: 'system', senderName: 'System', type: 'system', content: `${member?.userName || userId} was banned` }).save();
    res.json({ status: 'success', message: 'Member banned' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const unbanMember = async (req, res) => {
  try {
    const { userId } = req.body;
    await Group.findByIdAndUpdate(req.params.groupId, { $pull: { banned: userId } });
    res.json({ status: 'success', message: 'Member unbanned' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getPublicGroups = async (req, res) => {
  try {
    const { q, category, page = 1, limit = 20 } = req.query;
    const filter = { 'settings.isPublic': true, isArchived: false };
    if (q) filter.name = new RegExp(q, 'i');
    if (category) filter['settings.category'] = category;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [groups, total] = await Promise.all([
      Group.find(filter).select('-members -pinnedMessages').sort({ memberCount: -1 }).skip(skip).limit(parseInt(limit)),
      Group.countDocuments(filter)
    ]);
    res.json({ status: 'success', data: groups, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getScheduledMessages = async (req, res) => {
  try {
    const messages = await GroupMessage.find({ groupId: req.params.groupId, isSent: false }).sort({ scheduledAt: 1 });
    res.json({ status: 'success', data: messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
