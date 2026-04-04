import SuperChat from '../models/SuperChat.js';
import SuperMessage from '../models/SuperMessage.js';
import Group from '../models/Group.js';
import crypto from 'crypto';

export const createGroup = async (req, res) => {
  try {
    const { name, participants, adminId, description, avatar } = req.body;
    const chat = new SuperChat({ participants: [...new Set([...participants, adminId])], isGroup: true, chatName: name, groupAdmin: adminId });
    await chat.save();
    const inviteCode = crypto.randomBytes(4).toString('hex');
    const group = new Group({ chatId: chat._id, description, avatar, admins: [adminId], inviteCode });
    await group.save();
    res.status(201).json({ chat, group });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId).populate('chatId');
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateGroupSettings = async (req, res) => {
  try {
    const group = await Group.findByIdAndUpdate(req.params.groupId, req.body, { new: true });
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateDescription = async (req, res) => {
  try {
    const { description, name } = req.body;
    const group = await Group.findByIdAndUpdate(req.params.groupId, { description }, { new: true });
    if (name) await SuperChat.findByIdAndUpdate(group.chatId, { chatName: name });
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const addMembers = async (req, res) => {
  try {
    const { userIds } = req.body;
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    await SuperChat.findByIdAndUpdate(group.chatId, { $addToSet: { participants: { $each: userIds } } });
    res.json({ message: 'Members added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    await SuperChat.findByIdAndUpdate(group.chatId, { $pull: { participants: userId } });
    await Group.findByIdAndUpdate(groupId, { $pull: { admins: userId } });
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUserGroups = async (req, res) => {
  try {
    const { userId } = req.params;
    const chats = await SuperChat.find({ participants: userId, isGroup: true }).populate('latestMessage');
    const results = [];
    for (const chat of chats) {
      const group = await Group.findOne({ chatId: chat._id });
      results.push({ chat, group });
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const makeAdmin = async (req, res) => {
  try {
    const { userId } = req.body;
    const group = await Group.findByIdAndUpdate(req.params.groupId, { $addToSet: { admins: userId } }, { new: true });
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const removeAdmin = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const group = await Group.findByIdAndUpdate(groupId, { $pull: { admins: userId } }, { new: true });
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { senderId, content, attachments, replyTo, forwardedFrom, mentions, scheduledAt } = req.body;
    const group = await Group.findById(groupId).populate('chatId');
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (group.onlyAdminsCanMessage && !group.admins.includes(senderId)) {
      return res.status(403).json({ error: 'Only admins can send messages in this group' });
    }
    const isSent = !scheduledAt || new Date(scheduledAt) <= new Date();
    const msg = new SuperMessage({
      chatId: group.chatId,
      senderId, content,
      attachments: attachments || [],
      replyTo: replyTo || null,
      forwardedFrom: forwardedFrom || null,
      mentions: mentions || [],
      isSent,
      scheduledAt: scheduledAt || null
    });
    await msg.save();
    if (isSent) {
      await SuperChat.findByIdAndUpdate(group.chatId, { latestMessage: msg._id });
    }
    res.status(201).json({ status: 'success', data: msg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 50, before } = req.query;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    const filter = { chatId: group.chatId, isSent: true, isDeleted: false };
    if (before) filter.createdAt = { $lt: new Date(before) };
    const messages = await SuperMessage.find(filter)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('replyTo');
    res.json({ status: 'success', data: messages.reverse() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const reactToGroupMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId, emoji } = req.body;
    const msg = await SuperMessage.findById(messageId);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    const existing = msg.reactions.findIndex(r => r.userId === userId);
    if (existing > -1) msg.reactions.splice(existing, 1);
    if (emoji) msg.reactions.push({ userId, emoji });
    await msg.save();
    res.json({ status: 'success', data: msg.reactions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteGroupMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId, forEveryone } = req.body;
    const msg = await SuperMessage.findById(messageId);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    if (msg.senderId !== userId) return res.status(403).json({ error: 'Not authorized' });
    if (forEveryone) {
      msg.isDeletedEveryone = true;
      msg.isDeleted = true;
      msg.content = '';
      msg.attachments = [];
    } else {
      msg.isDeleted = true;
    }
    await msg.save();
    res.json({ status: 'success', message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const pinGroupMessage = async (req, res) => {
  try {
    const { groupId, messageId } = req.params;
    await SuperMessage.findByIdAndUpdate(messageId, { isPinned: true });
    res.json({ status: 'success', message: 'Message pinned' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getGroupPinnedMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    const messages = await SuperMessage.find({ chatId: group.chatId, isPinned: true, isDeleted: false });
    res.json({ status: 'success', data: messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
