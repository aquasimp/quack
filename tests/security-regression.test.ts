import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { canAccessGroup, canPostToGroup } from '../src/lib/permissions';
import {
  sanitizeRecruiterFilter,
  validateProfileUpdate,
  validateMessageInput,
} from '../src/lib/validation';
import {
  validateResumeAnalysis,
  validateCareerAdvice,
} from '../src/lib/ai/aiValidation';
import { rateLimit } from '../src/lib/rateLimit';
import { JWTPayload } from '../src/lib/auth';

describe('Comprehensive Security Regression Suite', () => {
  describe('1. IDOR & Anti-Enumeration Access Control', () => {
    const studentUser: JWTPayload = {
      userId: 'usr_student_01',
      role: 'student',
      email: 'student01@campus.edu',
      name: 'Alice Student',
    };

    const strangerUser: JWTPayload = {
      userId: 'usr_stranger_99',
      role: 'student',
      email: 'stranger@campus.edu',
      name: 'Eve Intruder',
    };

    const facultyUser: JWTPayload = {
      userId: 'usr_faculty_10',
      role: 'faculty',
      email: 'prof@campus.edu',
      name: 'Prof. Davis',
    };

    const tpoUser: JWTPayload = {
      userId: 'usr_tpo_20',
      role: 'tpo',
      email: 'tpo@campus.edu',
      name: 'Officer Lee',
    };

    const privateHostelGroup = {
      _id: 'grp_hostel_01',
      type: 'hostel',
      members: ['usr_student_01'],
      admins: ['usr_student_01'],
      createdBy: 'usr_student_01',
    };

    const academicGroup = {
      _id: 'grp_academic_01',
      type: 'academic',
      members: ['usr_student_01'],
      admins: ['usr_faculty_10'],
      createdBy: 'usr_faculty_10',
    };

    const placementGroup = {
      _id: 'grp_placement_01',
      type: 'placement',
      members: ['usr_student_01'],
      admins: ['usr_tpo_20'],
      createdBy: 'usr_tpo_20',
    };

    test('denies non-members from viewing or posting to private student groups', () => {
      assert.equal(canAccessGroup(privateHostelGroup, strangerUser), false);
      assert.equal(canPostToGroup(privateHostelGroup, strangerUser), false);
    });

    test('grants enrolled student access to their group', () => {
      assert.equal(canAccessGroup(privateHostelGroup, studentUser), true);
      assert.equal(canPostToGroup(privateHostelGroup, studentUser), true);
    });

    test('denies faculty and TPO from accessing private hostel groups without explicit membership', () => {
      assert.equal(canAccessGroup(privateHostelGroup, facultyUser), false);
      assert.equal(canAccessGroup(privateHostelGroup, tpoUser), false);
    });

    test('grants faculty access to academic groups', () => {
      assert.equal(canAccessGroup(academicGroup, facultyUser), true);
      assert.equal(canPostToGroup(academicGroup, facultyUser), true);
    });

    test('grants TPO access to placement groups', () => {
      assert.equal(canAccessGroup(placementGroup, tpoUser), true);
      assert.equal(canPostToGroup(placementGroup, tpoUser), true);
    });

    test('denies unauthenticated requests completely', () => {
      assert.equal(canAccessGroup(academicGroup, null), false);
      assert.equal(canPostToGroup(placementGroup, undefined), false);
    });
  });

  describe('2. Profile Mass-Assignment & Strict Allowlist Defense', () => {
    test('accepts valid student profile updates with allowed fields only', () => {
      const validPayload = {
        bio: 'Focused on distributed systems and cloud security.',
        skills: ['Rust', 'TypeScript', 'Docker'],
        linkedin: 'linkedin.com/in/alice',
        github: 'github.com/alice',
        projects: [
          {
            name: 'Blast Radius Mapper',
            description: 'Static analysis call graph security tool',
            tech: ['Python', 'NetworkX'],
            link: 'https://github.com/alice/brm',
          },
        ],
      };

      const result = validateProfileUpdate(validPayload);
      assert.equal(result.valid, true);
      assert.equal(result.data.bio, validPayload.bio);
      assert.deepEqual(result.data.skills, validPayload.skills);
      assert.equal((result.data.projects as unknown[]).length, 1);
    });

    test('strictly rejects attempt to inject academic record (cgpa)', () => {
      const hostile = { cgpa: 9.9 };
      const result = validateProfileUpdate(hostile);
      assert.equal(result.valid, false);
      assert.ok(result.error?.includes('cgpa'));
    });

    test('strictly rejects attempt to inject ownership fields (userId, _id)', () => {
      assert.equal(validateProfileUpdate({ userId: 'victim_id_123' }).valid, false);
      assert.equal(validateProfileUpdate({ _id: 'new_id_123' }).valid, false);
    });

    test('strictly rejects attempt to manipulate roles or privilege flags', () => {
      assert.equal(validateProfileUpdate({ role: 'admin' }).valid, false);
      assert.equal(validateProfileUpdate({ roles: ['tpo', 'faculty'] }).valid, false);
      assert.equal(validateProfileUpdate({ isAdmin: true }).valid, false);
    });

    test('strictly rejects attempt to inject calculated placement readiness score', () => {
      const result = validateProfileUpdate({ placementReadinessScore: 100 });
      assert.equal(result.valid, false);
      assert.ok(result.error?.includes('placementReadinessScore'));
    });

    test('strictly rejects payloads containing multiple forbidden fields mixed with valid fields', () => {
      const mixed = {
        bio: 'Valid bio',
        cgpa: 10,
        role: 'tpo',
        userId: 'admin_user',
        placementReadinessScore: 99,
      };
      const result = validateProfileUpdate(mixed);
      assert.equal(result.valid, false);
    });

    test('strictly rejects prototype pollution keys in profile updates', () => {
      const protoPayload = JSON.parse('{"__proto__": {"polluted": true}, "bio": "test"}');
      const result = validateProfileUpdate(protoPayload);
      assert.equal(result.valid, false);
    });

    test('rejects non-object or empty inputs gracefully', () => {
      assert.equal(validateProfileUpdate(null).valid, false);
      assert.equal(validateProfileUpdate(undefined).valid, false);
      assert.equal(validateProfileUpdate('not-an-object').valid, false);
      assert.equal(validateProfileUpdate([]).valid, false);
      assert.equal(validateProfileUpdate({}).valid, false);
    });
  });

  describe('3. AI to MongoDB Query Injection Defense', () => {
    test('neutralizes $where JavaScript execution payloads', () => {
      const filter = sanitizeRecruiterFilter({
        $where: 'function() { sleep(5000); return true; }',
      });
      assert.deepEqual(filter, {});
    });

    test('neutralizes $expr aggregation injection payloads', () => {
      const filter = sanitizeRecruiterFilter({
        $expr: { $gt: ['$passwordHash', ''] },
      });
      assert.deepEqual(filter, {});
    });

    test('neutralizes $function and $accumulator operator payloads', () => {
      const filter = sanitizeRecruiterFilter({
        $function: { body: 'function() { return 1; }', args: [], lang: 'js' },
        $accumulator: { init: 'function() {}' },
      });
      assert.deepEqual(filter, {});
    });

    test('rejects operator confusion: forbids $regex on numeric fields (cgpa)', () => {
      const confusingPayload = {
        cgpa: { $regex: '.*' },
      };
      const filter = sanitizeRecruiterFilter(confusingPayload);
      // $regex is not an allowed numeric operator for cgpa
      assert.deepEqual(filter, {});
    });

    test('rejects operator confusion: forbids $all on numeric fields (semester)', () => {
      const confusingPayload = {
        semester: { $all: [1, 2, 3] },
      };
      const filter = sanitizeRecruiterFilter(confusingPayload);
      assert.deepEqual(filter, {});
    });

    test('drops unauthorized data fields (passwordHash, salary, ssn, role)', () => {
      const filter = sanitizeRecruiterFilter({
        passwordHash: 'secret',
        salary: { $gt: 100000 },
        role: 'admin',
        cgpa: { $gte: 8.0 },
      });
      assert.equal(filter.passwordHash, undefined);
      assert.equal(filter.salary, undefined);
      assert.equal(filter.role, undefined);
      assert.deepEqual(filter.cgpa, { $gte: 8.0 });
    });

    test('strictly drops prototype pollution payloads in recruiter queries', () => {
      const payload = JSON.parse('{"__proto__": {"admin": true}, "branch": "CSE"}');
      const filter = sanitizeRecruiterFilter(payload);
      assert.equal((filter as Record<string, unknown>).admin, undefined);
      assert.equal(filter.branch, 'CSE');
    });

    test('drops deeply nested object structures (> 3 levels)', () => {
      const deeplyNested = {
        branch: {
          level1: {
            level2: {
              level3: {
                level4: 'malicious',
              },
            },
          },
        },
      };
      const filter = sanitizeRecruiterFilter(deeplyNested);
      assert.deepEqual(filter, {});
    });

    test('safely clamps huge arrays in $in and $all', () => {
      const hugeArray = Array.from({ length: 100 }, (_, i) => `Skill-${i}`);
      const filter = sanitizeRecruiterFilter({
        skills: { $all: hugeArray },
      }) as { skills: { $all: string[] } };

      assert.ok(filter.skills);
      assert.equal(filter.skills.$all.length, 20); // Clamped to 20 max
    });
  });

  describe('4. AI Output Schema Validation & Normalization', () => {
    test('validates and normalizes valid ResumeAnalysis output', () => {
      const rawOutput = {
        readinessScore: 84.5,
        identifiedSkills: ['Python', 'Django', 'PostgreSQL'],
        missingCompetencies: ['Kubernetes'],
        strengths: ['Solid backend architecture'],
        weaknesses: ['DevOps tooling'],
        roadmap: [
          { phase: 'Phase 1', duration: '2 weeks', tasks: ['Learn Docker basics'] },
        ],
        summary: 'Strong candidate for junior backend engineer roles.',
      };

      const validated = validateResumeAnalysis(rawOutput);
      assert.equal(validated.readinessScore, 85);
      assert.deepEqual(validated.identifiedSkills, ['Python', 'Django', 'PostgreSQL']);
      assert.equal(validated.roadmap.length, 1);
      assert.equal(validated.roadmap[0].tasks[0], 'Learn Docker basics');
    });

    test('safely clamps out-of-range and malformed readiness scores', () => {
      assert.equal(validateResumeAnalysis({ readinessScore: 150 }).readinessScore, 100);
      assert.equal(validateResumeAnalysis({ readinessScore: -20 }).readinessScore, 0);
      assert.equal(validateResumeAnalysis({ readinessScore: 'invalid' }).readinessScore, 0);
    });

    test('handles completely null or malformed model output without throwing', () => {
      const fallback = validateResumeAnalysis(null);
      assert.equal(fallback.readinessScore, 0);
      assert.deepEqual(fallback.identifiedSkills, []);
      assert.ok(fallback.summary.length > 0);
    });

    test('validates and normalizes CareerAdvice output', () => {
      const rawAdvice = {
        currentLevel: 'Intermediate',
        targetRole: 'Full Stack Engineer',
        gapAnalysis: [{ area: 'System Design', current: 'Basic', required: 'Advanced' }],
        studyPlan: [{ week: 'Week 1-2', focus: 'Caching & Redis', resources: ['redis.io'] }],
        recommendations: ['Build a real-time messaging application.'],
      };

      const validated = validateCareerAdvice(rawAdvice, 'Full Stack Engineer');
      assert.equal(validated.currentLevel, 'Intermediate');
      assert.equal(validated.targetRole, 'Full Stack Engineer');
      assert.equal(validated.gapAnalysis.length, 1);
      assert.equal(validated.studyPlan.length, 1);
    });

    test('returns structured fallback for malformed CareerAdvice output', () => {
      const fallback = validateCareerAdvice(null, 'Data Scientist');
      assert.equal(fallback.targetRole, 'Data Scientist');
      assert.ok(Array.isArray(fallback.gapAnalysis));
      assert.ok(Array.isArray(fallback.studyPlan));
      assert.ok(fallback.recommendations.length > 0);
    });
  });

  describe('5. Token Bucket Rate Limiting & Abuse Prevention', () => {
    test('enforces rate limit ceilings and returns Retry-After headers info', () => {
      const testKey = `test-user-${Date.now()}`;
      const limit = 3;

      const r1 = rateLimit(testKey, limit, 60_000);
      assert.equal(r1.success, true);
      assert.equal(r1.remaining, 2);

      const r2 = rateLimit(testKey, limit, 60_000);
      assert.equal(r2.success, true);
      assert.equal(r2.remaining, 1);

      const r3 = rateLimit(testKey, limit, 60_000);
      assert.equal(r3.success, true);
      assert.equal(r3.remaining, 0);

      // 4th request must be blocked
      const r4 = rateLimit(testKey, limit, 60_000);
      assert.equal(r4.success, false);
      assert.equal(r4.remaining, 0);
      assert.ok(r4.reset > 0);
    });
  });
});
