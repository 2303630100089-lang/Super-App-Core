import Task from '../models/Task.js';

export const getTasks = async (req, res) => {
  try {
    const userId = req.params.userId || req.headers['x-user-id'];
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const tasks = await Task.find({ userId }).sort({ createdAt: -1 });
    res.json({ status: 'success', data: tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createTask = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.body.userId;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const { title, description, priority, dueDate, list, assignees, tags } = req.body;
    const task = new Task({ userId, title, description, priority, dueDate, list, assignees, tags });
    await task.save();
    res.status(201).json({ status: 'success', data: task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.headers['x-user-id'] || req.body.userId;
    const { title, description, completed, priority, dueDate, list, assignees, tags } = req.body;
    const update = {};
    if (title !== undefined) update.title = String(title);
    if (description !== undefined) update.description = String(description);
    if (completed !== undefined) {
      update.completed = Boolean(completed);
      update.completedAt = completed ? new Date() : null;
    }
    if (priority !== undefined) update.priority = String(priority);
    if (dueDate !== undefined) update.dueDate = dueDate;
    if (list !== undefined) update.list = String(list);
    if (assignees !== undefined) update.assignees = assignees;
    if (tags !== undefined) update.tags = tags;
    const task = await Task.findOneAndUpdate({ _id: String(taskId), userId: String(userId) }, update, { new: true });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ status: 'success', data: task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.headers['x-user-id'];
    await Task.findOneAndDelete({ _id: String(taskId), userId: String(userId) });
    res.json({ status: 'success', message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
