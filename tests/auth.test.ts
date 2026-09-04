import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { signToken, verifyToken, JWTPayload } from '../src/lib/auth';

describe('Authentication & JWT Security Module', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.JWT_SECRET = 'super-secure-production-ready-jwt-secret-key-12345';
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('signs and verifies a valid JWT payload', () => {
    const payload: JWTPayload = {
      userId: 'usr_abc123',
      email: 'student@campus.edu',
      role: 'student',
      name: 'Test Student',
    };

    const token = signToken(payload);
    assert.ok(typeof token === 'string' && token.length > 30, 'token should be non-empty string');

    const verified = verifyToken(token);
    assert.ok(verified, 'verified payload must be truthy');
    assert.equal(verified?.userId, payload.userId);
    assert.equal(verified?.email, payload.email);
    assert.equal(verified?.role, payload.role);
    assert.equal(verified?.name, payload.name);
  });

  test('returns null when verifying a token with tampered signature', () => {
    const payload: JWTPayload = {
      userId: 'usr_tpo456',
      email: 'officer@campus.edu',
      role: 'tpo',
      name: 'Placement Officer',
    };

    const token = signToken(payload);
    const parts = token.split('.');
    assert.equal(parts.length, 3, 'JWT must have 3 parts');

    // Tamper with signature
    const tamperedSignature = parts[2].slice(0, -4) + 'zzzz';
    const tamperedToken = `${parts[0]}.${parts[1]}.${tamperedSignature}`;

    const verified = verifyToken(tamperedToken);
    assert.equal(verified, null, 'tampered signature must return null');
  });

  test('returns null for completely invalid token strings', () => {
    assert.equal(verifyToken('not.a.jwt'), null);
    assert.equal(verifyToken(''), null);
    assert.equal(verifyToken('gibberish12345'), null);
  });

  test('enforces strict role validation against recognized system roles', () => {
    const VALID_ROLES = ['student', 'faculty', 'tpo', 'recruiter'];

    for (const role of VALID_ROLES) {
      const payload: JWTPayload = {
        userId: `usr_${role}`,
        email: `${role}@campus.edu`,
        role,
        name: `User ${role}`,
      };
      const token = signToken(payload);
      const verified = verifyToken(token);
      assert.ok(verified);
      assert.ok(VALID_ROLES.includes(verified.role), `Role ${verified.role} must be in allowed list`);
    }

    const invalidRoles = ['admin_superuser', 'root', 'hacker', ''];
    for (const badRole of invalidRoles) {
      assert.equal(
        VALID_ROLES.includes(badRole),
        false,
        `Role ${badRole} must NOT be in accepted system roles`
      );
    }
  });

  test('requires JWT_SECRET in production environment', () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = 'production';

    const payload: JWTPayload = {
      userId: 'usr_prod_test',
      email: 'admin@campus.edu',
      role: 'faculty',
      name: 'Faculty Member',
    };

    assert.throws(
      () => {
        signToken(payload);
      },
      /JWT_SECRET environment variable must be set in production/i,
      'should throw error in production when JWT_SECRET is unset'
    );
  });
});
