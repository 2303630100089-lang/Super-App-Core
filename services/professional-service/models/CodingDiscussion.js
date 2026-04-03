import mongoose from 'mongoose';

const codingDiscussionSchema = new mongoose.Schema({
  authorId: { type: String, required: true },
  authorName: { type: String, default: 'Developer' },
  authorAvatar: { type: String },
  topic: { type: String, required: true }, // e.g., 'DSA', 'Web Dev', 'ML'
  title: { type: String, required: true },
  content: { type: String, required: true },
  tags: [{ type: String }],
  likes: [{ type: String }],
  replies: { type: Number, default: 0 },
  isPinned: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('CodingDiscussion', codingDiscussionSchema);
