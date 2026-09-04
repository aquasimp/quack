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
    test('strictly rejects forbidden field injections (cgpa, userId, role, placementReadinessScore)', () => {
      assert.equal(validateProfileUpdate({ cgpa: 9.8 }).valid, false);
      assert.equal(validateProfileUpdate({ userId: 'other_user_id' }).valid, false);
      assert.equal(validateProfileUpdate({ _id: 'target_id' }).valid, false);
      assert.equal(validateProfileUpdate({ role: 'admin' }).valid, false);
      assert.equal(validateProfileUpdate({ placementReadinessScore: 100 }).valid, false);
      assert.equal(validateProfileUpdate({ branch: 'CSE' }).valid, false);
    });

    test('accepts valid student profile updates and clamps bounds', () => {
      const validUpdate = {
        bio: 'Passionate software developer interested in distributed systems.',
        skills: ['Python', 'Docker', 'TypeScript'],
        github: 'github.com/student',
        linkedin: 'linkedin.com/in/student',
      };

      const result = validateProfileUpdate(validUpdate);
      assert.equal(result.valid, true);
      assert.equal(result.data.bio, 'Passionate software developer interested in distributed systems.');
      assert.deepEqual(result.data.skills, ['Python', 'Docker', 'TypeScript']);
      assert.equal(result.data.github, 'github.com/student');
    });

    test('clamps oversized text and array fields for valid updates', () => {
      const overflowUpdate = {
        bio: 'A'.repeat(800), // Should clamp to 500 chars
        skills: Array.from({ length: 50 }, (_, i) => `Skill-${i}`), // Should clamp to 30
      };

      const result = validateProfileUpdate(overflowUpdate);
      assert.equal(result.valid, true);
      assert.equal((result.data.bio as string).length, 500);
      assert.equal((result.data.skills as string[]).length, 30);
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
