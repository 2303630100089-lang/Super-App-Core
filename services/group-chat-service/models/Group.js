import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  avatar: { type: String, default: '' },
  createdBy: { type: String, required: true },
  admins: [String],
  members: [{
    userId: String,
    userName: String,
    avatar: String,
    role: { type: String, enum: ['admin', 'moderator', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
    isMuted: { type: Boolean, default: false },
    mutedUntil: Date
  }],
  memberCount: { type: Number, default: 0 },
  banned: [{ type: String }], // userId array
  settings: {
    onlyAdminsCanPost: { type: Boolean, default: false },
    onlyAdminsCanEditInfo: { type: Boolean, default: true },
    approveNewMembers: { type: Boolean, default: false },
    maxMembers: { type: Number, default: 256 },
    disappearingMessages: { type: Number, default: 0 }, // 0 = off, seconds otherwise
    slowModeSeconds: { type: Number, default: 0 }, // 0 = off
    isPublic: { type: Boolean, default: false },
    category: { type: String, default: '' },
    tags: [{ type: String }]
  },
  inviteLink: { type: String, unique: true, sparse: true },
  pinnedMessages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'GroupMessage' }],
  lastMessage: {
    content: String,
    senderId: String,
    senderName: String,
    timestamp: Date
  },
  isArchived: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Group', groupSchema);
