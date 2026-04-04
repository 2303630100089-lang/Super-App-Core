import mongoose from 'mongoose';

const calendarEventSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  date: { type: String, required: true }, // YYYY-MM-DD
  time: { type: String, default: '09:00' },
  endTime: { type: String, default: '10:00' },
  color: { type: String, default: 'bg-blue-500' },
  type: { type: String, enum: ['meeting', 'reminder', 'event', 'task'], default: 'event' },
  location: { type: String, default: '' },
  recurring: { type: Boolean, default: false },
  sharedWith: [{ type: String }],
}, { timestamps: true });

export default mongoose.model('CalendarEvent', calendarEventSchema);
