import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  chatName: { type: String, trim: true },
  isGroupChat: { type: Boolean, default: false },
  users: [{
    userId: String,
    role: { type: String, enum: ['admin', 'moderator', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now }
  }],
  latestMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  groupAdmin: { type: String },
  description: { type: String, default: '' },
  groupIcon: { type: String, default: '' },
  isAnonymous: { type: Boolean, default: false },
  revealedUsers: [String],
  settings: {
    whoCanSendMessages: { type: String, enum: ['everyone', 'adminsOnly'], default: 'everyone' },
    whoCanEditInfo: { type: String, enum: ['everyone', 'adminsOnly'], default: 'everyone' },
    whoCanSeeMembers: { type: String, enum: ['everyone', 'adminsOnly'], default: 'everyone' },
    disappearingMessages: { type: Number, default: 0 } // in seconds
  },
  // AES-256-GCM key (hex) used to encrypt all messages in this chat
  encryptionKey: { type: String, select: false },
}, { timestamps: true });

export default mongoose.model('Chat', chatSchema);
