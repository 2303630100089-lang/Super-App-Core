import CodingDiscussion from '../models/CodingDiscussion.js';

const CODING_TOPICS = [
  { id: 'dsa', title: 'Data Structures & Algorithms', count: 124, color: 'bg-blue-500', icon: 'cpu' },
  { id: 'web', title: 'Web Development', count: 856, color: 'bg-orange-500', icon: 'globe' },
  { id: 'ml', title: 'Machine Learning', count: 342, color: 'bg-purple-500', icon: 'brain' },
  { id: 'mobile', title: 'Mobile Apps', count: 198, color: 'bg-green-500', icon: 'smartphone' },
  { id: 'devops', title: 'DevOps & Cloud', count: 231, color: 'bg-cyan-500', icon: 'cloud' },
  { id: 'security', title: 'Cybersecurity', count: 89, color: 'bg-red-500', icon: 'shield' },
  { id: 'os', title: 'Operating Systems', count: 67, color: 'bg-yellow-500', icon: 'server' },
  { id: 'db', title: 'Databases', count: 145, color: 'bg-pink-500', icon: 'database' },
];

export const getCodingTopics = async (req, res) => {
  try {
    res.json({ status: 'success', data: CODING_TOPICS });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getDiscussions = async (req, res) => {
  try {
    const { topic, limit = 20, skip = 0 } = req.query;
    const filter = topic ? { topic } : {};
    const discussions = await CodingDiscussion.find(filter)
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip));
    const total = await CodingDiscussion.countDocuments(filter);
    res.json({ status: 'success', data: discussions, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createDiscussion = async (req, res) => {
  try {
    const authorId = req.headers['x-user-id'] || req.body.authorId;
    const { authorName, authorAvatar, topic, title, content, tags } = req.body;
    const discussion = new CodingDiscussion({ authorId, authorName, authorAvatar, topic, title, content, tags });
    await discussion.save();
    res.status(201).json({ status: 'success', data: discussion });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const likeDiscussion = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const userId = req.headers['x-user-id'] || req.body.userId;
    const discussion = await CodingDiscussion.findById(discussionId);
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
