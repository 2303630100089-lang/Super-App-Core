import LiveStream from '../models/LiveStream.js';
import crypto from 'crypto';

export const getStreams = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { isLive: true };
    if (category && category !== 'All') filter.category = category;
    const streams = await LiveStream.find(filter).sort({ viewers: -1 }).limit(20);
    res.json(streams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const startStream = async (req, res) => {
  try {
    const hostId = req.headers['x-user-id'] || req.body.hostId;
    const { hostName, hostAvatar, title, category } = req.body;

    // End any existing live stream for this host
    await LiveStream.updateMany({ hostId, isLive: true }, { isLive: false, endedAt: new Date() });

    const streamKey = crypto.randomBytes(16).toString('hex');
    const stream = new LiveStream({ hostId, hostName, hostAvatar, title, category, streamKey, isLive: true });
    await stream.save();
    res.status(201).json(stream);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const endStream = async (req, res) => {
  try {
    const { streamId } = req.params;
    const hostId = req.headers['x-user-id'];
    const stream = await LiveStream.findOneAndUpdate(
      { _id: streamId, hostId },
      { isLive: false, endedAt: new Date() },
      { new: true }
    );
    if (!stream) return res.status(404).json({ error: 'Stream not found' });
    res.json(stream);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const joinStream = async (req, res) => {
  try {
    const { streamId } = req.params;
    await LiveStream.findByIdAndUpdate(streamId, { $inc: { viewers: 1 } });
    res.json({ status: 'joined' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const leaveStream = async (req, res) => {
  try {
    const { streamId } = req.params;
    await LiveStream.findByIdAndUpdate(streamId, { $inc: { viewers: -1 } });
    res.json({ status: 'left' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
