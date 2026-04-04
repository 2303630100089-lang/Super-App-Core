import CalendarEvent from '../models/CalendarEvent.js';

export const getEvents = async (req, res) => {
  try {
    const userId = String(req.params.userId || req.headers['x-user-id'] || '');
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const { month, year } = req.query;
    // Use $in for the sharedWith array field
    const filter = { $or: [{ userId }, { sharedWith: { $in: [userId] } }] };
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
    const userId = String(req.headers['x-user-id'] || '');
    if (!userId) return res.status(401).json({ error: 'Authentication required' });
    const { title, description, date, time, endTime, color, type, location, recurring, sharedWith } = req.body;
    const event = new CalendarEvent({
      userId,
      title: title ? String(title) : undefined,
      description: description ? String(description) : undefined,
      date: date ? String(date) : undefined,
      time: time ? String(time) : undefined,
      endTime: endTime ? String(endTime) : undefined,
      color: color ? String(color) : undefined,
      type: type ? String(type) : undefined,
      location: location ? String(location) : undefined,
      recurring: Boolean(recurring),
      sharedWith: Array.isArray(sharedWith) ? sharedWith.map(id => String(id)) : [],
    });
    await event.save();
    res.status(201).json({ status: 'success', data: event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const eventId = String(req.params.eventId);
    const userId = String(req.headers['x-user-id'] || '');
    if (!userId) return res.status(401).json({ error: 'Authentication required' });
    const { title, description, date, time, endTime, color, type, location, recurring, sharedWith } = req.body;
    const update = {};
    if (title !== undefined) update.title = String(title);
    if (description !== undefined) update.description = String(description);
    if (date !== undefined) update.date = String(date);
    if (time !== undefined) update.time = String(time);
    if (endTime !== undefined) update.endTime = String(endTime);
    if (color !== undefined) update.color = String(color);
    if (type !== undefined) update.type = String(type);
    if (location !== undefined) update.location = String(location);
    if (recurring !== undefined) update.recurring = Boolean(recurring);
    if (sharedWith !== undefined) update.sharedWith = Array.isArray(sharedWith) ? sharedWith.map(id => String(id)) : [];
    const event = await CalendarEvent.findOneAndUpdate({ _id: eventId, userId }, update, { new: true });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ status: 'success', data: event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const eventId = String(req.params.eventId);
    const userId = String(req.headers['x-user-id'] || '');
    if (!userId) return res.status(401).json({ error: 'Authentication required' });
    await CalendarEvent.findOneAndDelete({ _id: eventId, userId });
    res.json({ status: 'success', message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
