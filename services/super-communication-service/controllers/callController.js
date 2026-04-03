import CallLog from '../models/CallLog.js';

export const startCall = async (req, res) => {
  try {
    const { callerId, receiverId, chatId, callType, isGroupCall, participants } = req.body;
    
    const callLog = new CallLog({
      callerId,
      receiverId,
      chatId,
      callType,
      isGroupCall,
      participants: participants || [callerId, receiverId].filter(Boolean),
      status: 'ongoing',
      startedAt: new Date()
    });
    
    await callLog.save();
    res.status(201).json(callLog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const endCall = async (req, res) => {
  try {
    const { callId, status } = req.body; // status can be completed, missed, rejected
    const callLog = await CallLog.findById(callId);
    
    if (!callLog) return res.status(404).json({ error: 'Call not found' });

    callLog.status = status;
    callLog.endedAt = new Date();
    callLog.duration = Math.round((callLog.endedAt - callLog.startedAt) / 1000); // seconds
    
    await callLog.save();
    res.json(callLog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCallHistory = async (req, res) => {
  try {
    const userId = req.params.userId === 'me'
      ? req.headers['x-user-id']
      : req.params.userId;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const history = await CallLog.find({
      $or: [{ callerId: userId }, { receiverId: userId }, { participants: userId }]
    }).sort({ createdAt: -1 }).limit(50);
    
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
