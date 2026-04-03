import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  completed: { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  dueDate: { type: Date },
  list: { type: String, default: 'General' },
  assignees: [{ type: String }],
  tags: [{ type: String }],
  completedAt: { type: Date },
}, { timestamps: true });

export default mongoose.model('Task', taskSchema);
