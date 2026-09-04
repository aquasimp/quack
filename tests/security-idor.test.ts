import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Group IDOR & Anti-Enumeration Access Control', () => {
  interface MockGroup {
    _id: string;
    members: string[];
    admins: string[];
    createdBy: string;
  }

  interface MockUser {
    userId: string;
    role: string;
  }

  const checkGroupAccess = (
    group: MockGroup | null,
    user: MockUser | null
  ): { status: number; error?: string } => {
    if (!user) {
      return { status: 401, error: 'Not authenticated' };
    }
    if (!group) {
      return { status: 404, error: 'Group not found' };
    }

    const isMember =
      group.members.includes(user.userId) ||
      group.admins.includes(user.userId) ||
      group.createdBy === user.userId ||
      ['tpo', 'faculty'].includes(user.role);

    if (!isMember) {
      // 404 anti-enumeration: return 404 for unauthorized users rather than 403
      // so attackers cannot probe whether a private group exists
      return { status: 404, error: 'Group not found' };
    }

    return { status: 200 };
  };

  const sampleGroup: MockGroup = {
    _id: '65f1a2b3c4d5e6f7a8b9c001',
    members: ['usr_student_1', 'usr_student_2'],
    admins: ['usr_admin_1'],
    createdBy: 'usr_admin_1',
  };

  test('returns 401 when user is not authenticated', () => {
    const res = checkGroupAccess(sampleGroup, null);
    assert.equal(res.status, 401);
    assert.equal(res.error, 'Not authenticated');
  });

  test('returns 404 for non-existent group', () => {
    const user: MockUser = { userId: 'usr_student_1', role: 'student' };
    const res = checkGroupAccess(null, user);
    assert.equal(res.status, 404);
    assert.equal(res.error, 'Group not found');
  });

  test('returns 404 (anti-enumeration) when user is not a group member', () => {
    const nonMember: MockUser = { userId: 'usr_stranger_99', role: 'student' };
    const res = checkGroupAccess(sampleGroup, nonMember);
    assert.equal(res.status, 404);
    assert.equal(res.error, 'Group not found');
  });

  test('grants 200 to ordinary group members', () => {
    const member: MockUser = { userId: 'usr_student_2', role: 'student' };
    const res = checkGroupAccess(sampleGroup, member);
    assert.equal(res.status, 200);
  });

  test('grants 200 to group admin and creator', () => {
    const creator: MockUser = { userId: 'usr_admin_1', role: 'student' };
    const res = checkGroupAccess(sampleGroup, creator);
    assert.equal(res.status, 200);
  });

  test('grants 200 to faculty/tpo officers with campus-wide oversight', () => {
    const faculty: MockUser = { userId: 'usr_faculty_42', role: 'faculty' };
    const res = checkGroupAccess(sampleGroup, faculty);
    assert.equal(res.status, 200);
  });
});
