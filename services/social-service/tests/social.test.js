import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../index.js';
import UnifiedPost from '../models/UnifiedPost.js';
import UserBehavior from '../models/UserBehavior.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await UnifiedPost.deleteMany({});
  await UserBehavior.deleteMany({});
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const seedPost = (overrides = {}) =>
  UnifiedPost.create({
    userId: 'author-1',
    type: 'tweet',
    content: 'Hello world',
    ...overrides,
  });

// ─── Unified Feed ─────────────────────────────────────────────────────────────

describe('GET /unified/feed', () => {
  test('returns empty array when no posts exist', async () => {
    const res = await request(app).get('/unified/feed');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  test('returns posts sorted by rankScore', async () => {
    await seedPost({ userId: 'a1', content: 'popular', likes: ['u1', 'u2', 'u3'] });
    await seedPost({ userId: 'a2', content: 'unpopular' });

    const res = await request(app).get('/unified/feed');
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
    // popular post should rank first (more likes → higher rankScore)
    expect(res.body[0].content).toBe('popular');
  });

  test('filters by followingIds when provided', async () => {
    await seedPost({ userId: 'followed-user', content: 'from followed' });
    await seedPost({ userId: 'stranger', content: 'from stranger' });

    const res = await request(app)
      .get('/unified/feed')
      .query({ followingIds: 'followed-user' });

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].content).toBe('from followed');
  });

  test('uses behavior profile to boost preferred post type', async () => {
    await seedPost({ userId: 'a1', type: 'tweet', content: 'tweet post' });
    await seedPost({ userId: 'a2', type: 'thread', content: 'thread post' });

    // User prefers 'thread' content
    await UserBehavior.create({
      userId: 'tester',
      typeWeights: new Map([['thread', 10]]),
      hashtagWeights: new Map(),
      engagedAuthors: new Map(),
    });

    const res = await request(app)
      .get('/unified/feed')
      .query({ userId: 'tester' });

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
    // thread post should rank higher due to behavior boost
    expect(res.body[0].content).toBe('thread post');
  });

  test('handles pagination correctly', async () => {
    for (let i = 0; i < 5; i++) {
      await seedPost({ content: `post ${i}` });
    }

    const page1 = await request(app).get('/unified/feed').query({ limit: 2, page: 1 });
    const page2 = await request(app).get('/unified/feed').query({ limit: 2, page: 2 });

    expect(page1.body.length).toBe(2);
    expect(page2.body.length).toBe(2);
    // Pages should not overlap
    const ids1 = page1.body.map(p => p._id);
    const ids2 = page2.body.map(p => p._id);
    expect(ids1.some(id => ids2.includes(id))).toBe(false);
  });
});

// ─── Create Post ──────────────────────────────────────────────────────────────

describe('POST /unified/posts', () => {
  test('creates a post successfully', async () => {
    const res = await request(app).post('/unified/posts').send({
      userId: 'user-1',
      type: 'tweet',
      content: 'My first tweet',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.content).toBe('My first tweet');
  });

  test('returns 500 for missing required fields', async () => {
    const res = await request(app).post('/unified/posts').send({ content: 'no userId' });
    expect(res.statusCode).toBe(500);
  });
});

// ─── Interact With Post ───────────────────────────────────────────────────────

describe('POST /unified/interact', () => {
  test('likes a post and updates behavior profile', async () => {
    const post = await seedPost();

    const res = await request(app).post('/unified/interact').send({
      postId: post._id,
      userId: 'user-1',
      action: 'like',
    });

    expect(res.statusCode).toBe(200);
    const updated = await UnifiedPost.findById(post._id);
    expect(updated.likes).toContain('user-1');
  });

  test('unlikes an already liked post', async () => {
    const post = await seedPost({ likes: ['user-1'] });

    const res = await request(app).post('/unified/interact').send({
      postId: post._id,
      userId: 'user-1',
      action: 'like',
    });

    expect(res.statusCode).toBe(200);
    const updated = await UnifiedPost.findById(post._id);
    expect(updated.likes).not.toContain('user-1');
  });

  test('returns 404 for non-existent post', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).post('/unified/interact').send({
      postId: fakeId,
      userId: 'user-1',
      action: 'like',
    });
    expect(res.statusCode).toBe(404);
  });
});

// ─── Record Behavior ─────────────────────────────────────────────────────────

describe('POST /unified/behavior', () => {
  test('creates a new behavior record', async () => {
    const res = await request(app).post('/unified/behavior').send({
      userId: 'user-42',
      postType: 'tweet',
      hashtags: ['tech', 'ai'],
      authorId: 'author-99',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');

    const record = await UserBehavior.findOne({ userId: 'user-42' });
    expect(record).toBeTruthy();
    expect(record.typeWeights.get('tweet')).toBe(1);
    expect(record.hashtagWeights.get('tech')).toBe(1);
    expect(record.engagedAuthors.get('author-99')).toBe(1);
  });

  test('increments existing behavior counters on repeated interactions', async () => {
    const payload = { userId: 'user-42', postType: 'thread', hashtags: ['news'] };
    await request(app).post('/unified/behavior').send(payload);
    await request(app).post('/unified/behavior').send(payload);

    const record = await UserBehavior.findOne({ userId: 'user-42' });
    expect(record.typeWeights.get('thread')).toBe(2);
    expect(record.hashtagWeights.get('news')).toBe(2);
  });

  test('returns 400 when userId is missing', async () => {
    const res = await request(app).post('/unified/behavior').send({ postType: 'tweet' });
    expect(res.statusCode).toBe(400);
  });
});

// ─── Concurrent Request Test (100k simulation) ───────────────────────────────

describe('Concurrent request handling', () => {
  test('handles 200 simultaneous feed requests without errors', async () => {
    // Seed some posts first
    await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        seedPost({ userId: `user-${i}`, content: `post ${i}` })
      )
    );

    const CONCURRENT = 200;
    const results = await Promise.allSettled(
      Array.from({ length: CONCURRENT }, () =>
        request(app).get('/unified/feed').query({ limit: 10 })
      )
    );

    const failed = results.filter(r => r.status === 'rejected' || r.value?.statusCode >= 500);
    expect(failed.length).toBe(0);

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.statusCode === 200);
    expect(successful.length).toBe(CONCURRENT);
  }, 30000);
});
