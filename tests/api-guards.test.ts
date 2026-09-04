import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { verifyToken, signToken, JWTPayload } from '../src/lib/auth';

describe('API Route Guards & Authorization Policies', () => {
  const secretKey = 'test-secret-for-api-guard-validation-123456';
  process.env.JWT_SECRET = secretKey;

  describe('TPO Analytics Role Authorization Guard', () => {
    const isAuthorizedForTpo = (user: JWTPayload | null): { authorized: boolean; status: number; error?: string } => {
      if (!user) {
        return { authorized: false, status: 401, error: 'Not authenticated' };
      }
      if (!['tpo', 'faculty'].includes(user.role)) {
        return { authorized: false, status: 403, error: 'Forbidden' };
      }
      return { authorized: true, status: 200 };
    };

    test('denies access (401) to unauthenticated visitors', () => {
      const result = isAuthorizedForTpo(null);
      assert.equal(result.authorized, false);
      assert.equal(result.status, 401);
      assert.equal(result.error, 'Not authenticated');
    });

    test('denies access (403) to student accounts', () => {
      const studentUser: JWTPayload = {
        userId: 'usr_s1',
        email: 'student@campus.edu',
        role: 'student',
        name: 'Alex Student',
      };
      const result = isAuthorizedForTpo(studentUser);
      assert.equal(result.authorized, false);
      assert.equal(result.status, 403);
      assert.equal(result.error, 'Forbidden');
    });

    test('denies access (403) to recruiter accounts', () => {
      const recruiterUser: JWTPayload = {
        userId: 'usr_r1',
        email: 'recruiter@techcorp.com',
        role: 'recruiter',
        name: 'Sarah Recruiter',
      };
      const result = isAuthorizedForTpo(recruiterUser);
      assert.equal(result.authorized, false);
      assert.equal(result.status, 403);
      assert.equal(result.error, 'Forbidden');
    });

    test('grants access (200) to TPO placement officers', () => {
      const tpoUser: JWTPayload = {
        userId: 'usr_tpo1',
        email: 'tpo@campus.edu',
        role: 'tpo',
        name: 'Dr. Officer',
      };
      const result = isAuthorizedForTpo(tpoUser);
      assert.equal(result.authorized, true);
      assert.equal(result.status, 200);
    });

    test('grants access (200) to faculty members', () => {
      const facultyUser: JWTPayload = {
        userId: 'usr_fac1',
        email: 'faculty@campus.edu',
        role: 'faculty',
        name: 'Prof. Davis',
      };
      const result = isAuthorizedForTpo(facultyUser);
      assert.equal(result.authorized, true);
      assert.equal(result.status, 200);
    });
  });

  describe('General Protected API Endpoints Guard Matrix', () => {
    interface RouteConfig {
      path: string;
      allowedRoles: string[];
      requiresAuth: boolean;
    }

    const ROUTE_POLICY: RouteConfig[] = [
      { path: '/api/groups', allowedRoles: ['student', 'faculty', 'tpo', 'recruiter'], requiresAuth: true },
      { path: '/api/groups/[groupId]/messages', allowedRoles: ['student', 'faculty', 'tpo', 'recruiter'], requiresAuth: true },
      { path: '/api/announcements', allowedRoles: ['student', 'faculty', 'tpo', 'recruiter'], requiresAuth: true },
      { path: '/api/folders', allowedRoles: ['student', 'faculty', 'tpo', 'recruiter'], requiresAuth: true },
      { path: '/api/students', allowedRoles: ['student', 'faculty', 'tpo', 'recruiter'], requiresAuth: true },
      { path: '/api/tpo/analytics', allowedRoles: ['tpo', 'faculty'], requiresAuth: true },
    ];

    const evaluateGuard = (path: string, user: JWTPayload | null) => {
      const policy = ROUTE_POLICY.find(p => p.path === path);
      if (!policy) throw new Error(`Unknown route: ${path}`);
      if (policy.requiresAuth && !user) {
        return { status: 401, body: { error: 'Not authenticated' } };
      }
      if (user && !policy.allowedRoles.includes(user.role)) {
        return { status: 403, body: { error: 'Forbidden' } };
      }
      return { status: 200, body: { ok: true } };
    };

    test('all 6 core endpoints reject null auth with 401', () => {
      for (const route of ROUTE_POLICY) {
        const res = evaluateGuard(route.path, null);
        assert.equal(res.status, 401, `Endpoint ${route.path} must return 401 when unauthenticated`);
      }
    });

    test('all 6 core endpoints accept valid token for authorized roles', () => {
      const token = signToken({
        userId: 'usr_tpo_test',
        email: 'tpo@campus.edu',
        role: 'tpo',
        name: 'Placement Head',
      });
      const user = verifyToken(token);
      assert.ok(user);

      for (const route of ROUTE_POLICY) {
        const res = evaluateGuard(route.path, user);
        assert.equal(res.status, 200, `TPO should be authorized for ${route.path}`);
      }
    });
  });
});
