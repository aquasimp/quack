import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { rateLimit } from '../src/lib/rateLimit';

describe('Token Bucket Rate Limiter', () => {
  test('allows requests within bucket burst capacity', () => {
    const key = `test-user-${Date.now()}-1`;
    const limit = 5;

    for (let i = 0; i < limit; i++) {
      const res = rateLimit(key, limit, 10_000);
      assert.equal(res.success, true, `Request ${i + 1} should be permitted`);
      assert.equal(res.remaining, limit - 1 - i);
    }
  });

  test('exhausts tokens and blocks with 429 semantics once limit reached', () => {
    const key = `test-user-${Date.now()}-2`;
    const limit = 3;

    // Consume 3 tokens
    rateLimit(key, limit, 10_000);
    rateLimit(key, limit, 10_000);
    rateLimit(key, limit, 10_000);

    // 4th request must be rejected
    const blocked = rateLimit(key, limit, 10_000);
    assert.equal(blocked.success, false);
    assert.equal(blocked.remaining, 0);
    assert.ok(blocked.reset > Math.floor(Date.now() / 1000));
  });

  test('isolates rate limits between distinct user keys', () => {
    const keyA = `user-a-${Date.now()}`;
    const keyB = `user-b-${Date.now()}`;

    // Exhaust user A
    for (let i = 0; i < 3; i++) {
      rateLimit(keyA, 3, 10_000);
    }
    const resA = rateLimit(keyA, 3, 10_000);
    assert.equal(resA.success, false);

    // User B must still be allowed
    const resB = rateLimit(keyB, 3, 10_000);
    assert.equal(resB.success, true);
    assert.equal(resB.remaining, 2);
  });
});
