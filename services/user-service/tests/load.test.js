import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../index.js';
import User from '../models/User.js';

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
  await User.deleteMany({});
});

describe('Concurrent user request handling (100k simulation)', () => {
  test('handles 200 simultaneous GET /profile/:id requests without errors', async () => {
    // Pre-create profiles so responses are meaningful
    await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        User.create({ userId: `load-user-${i}`, name: `User ${i}` })
      )
    );

    const CONCURRENT = 200;
    const results = await Promise.allSettled(
      Array.from({ length: CONCURRENT }, (_, i) =>
        request(app).get(`/profile/load-user-${i % 20}`)
      )
    );

    const failed = results.filter(
      r => r.status === 'rejected' || (r.value && r.value.statusCode >= 500)
    );
    expect(failed.length).toBe(0);

    const successful = results.filter(
      r => r.status === 'fulfilled' && r.value.statusCode === 200
    );
    expect(successful.length).toBe(CONCURRENT);
  }, 30000);

  test('handles 200 simultaneous POST /profile (upsert) requests without errors', async () => {
    const CONCURRENT = 200;
    const results = await Promise.allSettled(
      Array.from({ length: CONCURRENT }, (_, i) =>
        request(app)
          .post('/profile')
          .send({ userId: `concurrent-user-${i}`, name: `Name ${i}`, bio: 'test bio' })
      )
    );

    const failed = results.filter(
      r => r.status === 'rejected' || (r.value && r.value.statusCode >= 500)
    );
    expect(failed.length).toBe(0);

    const successful = results.filter(
      r => r.status === 'fulfilled' && r.value.statusCode === 200
    );
    expect(successful.length).toBe(CONCURRENT);
  }, 30000);

  test('handles 200 simultaneous GET /settings requests without errors', async () => {
    const CONCURRENT = 200;
    const results = await Promise.allSettled(
      Array.from({ length: CONCURRENT }, (_, i) =>
        request(app).get('/settings').query({ userId: `settings-user-${i % 50}` })
      )
    );

    const failed = results.filter(
      r => r.status === 'rejected' || (r.value && r.value.statusCode >= 500)
    );
    expect(failed.length).toBe(0);

    const successful = results.filter(
      r => r.status === 'fulfilled' && r.value.statusCode === 200
    );
    expect(successful.length).toBe(CONCURRENT);
  }, 30000);
});
