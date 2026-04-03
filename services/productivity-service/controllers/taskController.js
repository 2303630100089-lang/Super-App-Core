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
    const update = { ...req.body };
    if (update.completed === true) update.completedAt = new Date();
    if (update.completed === false) update.completedAt = null;
    const task = await Task.findOneAndUpdate({ _id: taskId, userId }, update, { new: true });
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
    await Task.findOneAndDelete({ _id: taskId, userId });
    res.json({ status: 'success', message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
