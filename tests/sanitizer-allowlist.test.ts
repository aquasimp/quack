import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeRecruiterFilter,
  validateProfileUpdate,
  validateMessageInput,
  escapeRegex,
} from '../src/lib/validation';

describe('Security Sanitizer & Strict Allowlist Engine', () => {
  describe('Recruiter Query MongoDB Filter Sanitization', () => {
    test('strictly drops hostile $where and $expr injection payloads', () => {
      const hostilePayload = {
        $where: 'this.passwordHash.length > 0',
        $expr: { $gt: ['$salary', 100000] },
        branch: 'CSE',
      };
      const sanitized = sanitizeRecruiterFilter(hostilePayload);

      assert.equal(sanitized.$where, undefined);
      assert.equal(sanitized.$expr, undefined);
      assert.equal(sanitized.branch, 'CSE');
    });

    test('drops arbitrary unauthorized fields (e.g. passwordHash, role, placementScore)', () => {
      const payload = {
        role: 'admin',
        userId: '65f1a2b3c4d5e6f7a8b9c0d1',
        passwordHash: 'secret_hash',
        placementReadinessScore: 99,
        cgpa: { $gte: 8.5 },
      };
      const sanitized = sanitizeRecruiterFilter(payload);

      assert.equal(sanitized.role, undefined);
      assert.equal(sanitized.userId, undefined);
      assert.equal(sanitized.passwordHash, undefined);
      assert.equal(sanitized.placementReadinessScore, undefined);
      assert.deepEqual(sanitized.cgpa, { $gte: 8.5 });
    });

    test('accepts allowlisted fields with safe operators and clamps bounds', () => {
      const validQuery = {
        branch: 'ECE',
        cgpa: { $gte: 7.5, $lte: 9.8 },
        semester: { $gte: 6 },
        skills: { $all: ['React', 'TypeScript', 'Node.js'] },
      };
      const sanitized = sanitizeRecruiterFilter(validQuery);

      assert.equal(sanitized.branch, 'ECE');
      assert.deepEqual(sanitized.cgpa, { $gte: 7.5, $lte: 9.8 });
      assert.deepEqual(sanitized.semester, { $gte: 6 });
      assert.deepEqual(sanitized.skills, { $all: ['React', 'TypeScript', 'Node.js'] });
    });

    test('neutralizes ReDoS attempts by escaping regex special chars and clamping length', () => {
      const maliciousRegex = {
        branch: { $regex: '((((((a+)+)+)+)+)+)+$' },
      };
      const sanitized = sanitizeRecruiterFilter(maliciousRegex) as {
        branch: { $regex: string; $options: string };
      };

      assert.ok(sanitized.branch);
      assert.equal(sanitized.branch.$options, 'i');
      // Special characters must be escaped
      assert.ok(sanitized.branch.$regex.includes('\\('));
      assert.ok(sanitized.branch.$regex.includes('\\+'));
    });

    test('handles empty, null, or malformed filters safely', () => {
      assert.deepEqual(sanitizeRecruiterFilter(null), {});
      assert.deepEqual(sanitizeRecruiterFilter(undefined), {});
      assert.deepEqual(sanitizeRecruiterFilter('string'), {});
      assert.deepEqual(sanitizeRecruiterFilter([1, 2, 3]), {});
    });
  });

  describe('Profile Update Mass-Assignment Protection', () => {
    test('strictly strips userId, _id, and placementReadinessScore', () => {
      const hostileUpdate = {
        userId: 'malicious_user_id_override',
        _id: 'malicious_profile_id',
        placementReadinessScore: 100,
        role: 'tpo',
        branch: 'CSE',
        cgpa: 9.2,
        skills: ['Python', 'Docker'],
      };

      const result = validateProfileUpdate(hostileUpdate);
      assert.equal(result.valid, true);
      assert.equal(result.data.userId, undefined);
      assert.equal(result.data._id, undefined);
      assert.equal(result.data.placementReadinessScore, undefined);
      assert.equal(result.data.role, undefined);
      assert.equal(result.data.branch, 'CSE');
      assert.equal(result.data.cgpa, 9.2);
      assert.deepEqual(result.data.skills, ['Python', 'Docker']);
    });

    test('clamps and bounds profile numbers and text fields', () => {
      const overflowUpdate = {
        cgpa: 15.5, // Should clamp to 10
        semester: 12, // Should clamp to 8
        bio: 'A'.repeat(800), // Should clamp to 500 chars
      };

      const result = validateProfileUpdate(overflowUpdate);
      assert.equal(result.valid, true);
      assert.equal(result.data.cgpa, 10);
      assert.equal(result.data.semester, 8);
      assert.equal((result.data.bio as string).length, 500);
    });
  });

  describe('Message Input Validation', () => {
    test('rejects empty or whitespace-only messages', () => {
      assert.equal(validateMessageInput({ content: '' }).valid, false);
      assert.equal(validateMessageInput({ content: '   ' }).valid, false);
    });

    test('rejects messages exceeding 10,000 characters', () => {
      const hugeMessage = { content: 'x'.repeat(10_001) };
      const result = validateMessageInput(hugeMessage);
      assert.equal(result.valid, false);
      assert.ok(result.error?.includes('10,000'));
    });

    test('accepts valid message with default encryption and type', () => {
      const valid = { content: 'Hello team!' };
      const result = validateMessageInput(valid);
      assert.equal(result.valid, true);
      assert.equal(result.content, 'Hello team!');
      assert.equal(result.type, 'text');
      assert.equal(result.encrypted, true);
    });
  });
});
