import CalendarEvent from '../models/CalendarEvent.js';

export const getEvents = async (req, res) => {
  try {
    const userId = req.params.userId || req.headers['x-user-id'];
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const { month, year } = req.query;
    const filter = { $or: [{ userId: String(userId) }, { sharedWith: String(userId) }] };
    if (month && year) {
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);
      if (!isNaN(m) && !isNaN(y)) {
        const start = `${y}-${String(m).padStart(2, '0')}-01`;
        const endMonth = m === 12 ? 1 : m + 1;
        const endYear = m === 12 ? y + 1 : y;
        const end = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;
        filter.date = { $gte: start, $lt: end };
      }
    }
    const events = await CalendarEvent.find(filter).sort({ date: 1, time: 1 });
    res.json({ status: 'success', data: events });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createEvent = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.body.userId;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const { title, description, date, time, endTime, color, type, location, recurring, sharedWith } = req.body;
    const event = new CalendarEvent({ userId, title, description, date, time, endTime, color, type, location, recurring, sharedWith });
    await event.save();
    res.status(201).json({ status: 'success', data: event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.headers['x-user-id'];
    const event = await CalendarEvent.findOneAndUpdate({ _id: eventId, userId }, req.body, { new: true });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ status: 'success', data: event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.headers['x-user-id'];
    await CalendarEvent.findOneAndDelete({ _id: eventId, userId });
    res.json({ status: 'success', message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
