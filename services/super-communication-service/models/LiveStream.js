import mongoose from 'mongoose';

const liveStreamSchema = new mongoose.Schema({
  hostId: { type: String, required: true, index: true },
  hostName: { type: String, default: 'Streamer' },
  hostAvatar: { type: String },
  title: { type: String, required: true },
  category: { type: String, default: 'General' },
  thumbnail: { type: String },
  viewers: { type: Number, default: 0 },
  isLive: { type: Boolean, default: true, index: true },
  streamKey: { type: String },
  endedAt: { type: Date },
  gifts: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('LiveStream', liveStreamSchema);
