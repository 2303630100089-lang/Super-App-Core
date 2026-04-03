import CodingDiscussion from '../models/CodingDiscussion.js';

const TOPIC_DEFS = [
  { id: 'dsa', title: 'Data Structures & Algorithms', color: 'bg-blue-500', icon: 'cpu' },
  { id: 'web', title: 'Web Development', color: 'bg-orange-500', icon: 'globe' },
  { id: 'ml', title: 'Machine Learning', color: 'bg-purple-500', icon: 'brain' },
  { id: 'mobile', title: 'Mobile Apps', color: 'bg-green-500', icon: 'smartphone' },
  { id: 'devops', title: 'DevOps & Cloud', color: 'bg-cyan-500', icon: 'cloud' },
  { id: 'security', title: 'Cybersecurity', color: 'bg-red-500', icon: 'shield' },
  { id: 'os', title: 'Operating Systems', color: 'bg-yellow-500', icon: 'server' },
  { id: 'db', title: 'Databases', color: 'bg-pink-500', icon: 'database' },
];

const ALLOWED_TOPICS = new Set(TOPIC_DEFS.map(t => t.id));

export const getCodingTopics = async (req, res) => {
  try {
    const counts = await CodingDiscussion.aggregate([
      { $group: { _id: '$topic', count: { $sum: 1 } } }
    ]);
    const countMap = Object.fromEntries(counts.map(c => [c._id, c.count]));
    const topics = TOPIC_DEFS.map(t => ({ ...t, count: countMap[t.id] || 0 }));
    res.json({ status: 'success', data: topics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getDiscussions = async (req, res) => {
  try {
    const topic = req.query.topic && ALLOWED_TOPICS.has(String(req.query.topic)) ? String(req.query.topic) : null;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = Math.max(parseInt(req.query.skip, 10) || 0, 0);
    const filter = topic ? { topic } : {};
    const discussions = await CodingDiscussion.find(filter)
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(limit)
      .skip(skip);
    const total = await CodingDiscussion.countDocuments(filter);
    res.json({ status: 'success', data: discussions, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createDiscussion = async (req, res) => {
  try {
    const authorId = String(req.headers['x-user-id'] || '');
    if (!authorId) return res.status(401).json({ error: 'Authentication required' });
    const { authorName, authorAvatar, topic, title, content, tags } = req.body;
    if (!ALLOWED_TOPICS.has(String(topic))) {
      return res.status(400).json({ error: 'Invalid topic' });
    }
    const discussion = new CodingDiscussion({
      authorId: String(authorId),
      authorName: authorName ? String(authorName) : 'Developer',
      authorAvatar: authorAvatar ? String(authorAvatar) : undefined,
      topic: String(topic),
      title: String(title),
      content: String(content),
      tags: Array.isArray(tags) ? tags.map(t => String(t)) : [],
    });
    await discussion.save();
    res.status(201).json({ status: 'success', data: discussion });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const likeDiscussion = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const userId = String(req.headers['x-user-id'] || req.body.userId || '');
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const discussion = await CodingDiscussion.findById(String(discussionId));
    if (!discussion) return res.status(404).json({ error: 'Discussion not found' });
    const liked = discussion.likes.includes(userId);
    if (liked) {
      discussion.likes = discussion.likes.filter(id => id !== userId);
    } else {
      discussion.likes.push(userId);
    }
    await discussion.save();
    res.json({ status: 'success', liked: !liked, likes: discussion.likes.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
