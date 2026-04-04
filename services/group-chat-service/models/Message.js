import mongoose from 'mongoose';

const groupMessageSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true, index: true },
  senderId: { type: String, required: true },
  senderName: { type: String },
  senderAvatar: { type: String },
  type: { type: String, enum: ['text', 'image', 'video', 'file', 'audio', 'sticker', 'location', 'contact', 'system', 'poll'], default: 'text' },
  content: { type: String, default: '' },
  media: {
    url: String,
    filename: String,
    size: Number,
    mimeType: String,
    thumbnail: String,
    duration: Number // for audio/video
  },
  poll: {
    question: String,
    options: [{ text: String, voters: [String] }],
    isAnonymous: { type: Boolean, default: false },
    multipleChoice: { type: Boolean, default: false }
  },
  location: { name: String, lat: Number, lon: Number },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'GroupMessage' },
  forwardedFrom: {
    groupId: String,
    groupName: String,
    messageId: String
  },
  readBy: [{
    userId: String,
    readAt: { type: Date, default: Date.now }
  }],
  deliveredTo: [String],
  reactions: [{
    userId: String,
    emoji: String,
    reactedAt: { type: Date, default: Date.now }
  }],
  mentions: [String],
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
  deletedForEveryone: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
  expiresAt: { type: Date }, // for disappearing messages
  scheduledAt: { type: Date, default: null }, // null = send immediately
  isSent: { type: Boolean, default: true } // false when scheduledAt is in future
}, { timestamps: true });

groupMessageSchema.index({ groupId: 1, createdAt: -1 });

export default mongoose.model('GroupMessage', groupMessageSchema);
