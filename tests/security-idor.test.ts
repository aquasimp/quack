import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { canAccessGroup, canPostToGroup, GroupLike } from '../src/lib/permissions';
import { JWTPayload } from '../src/lib/auth';

describe('Group IDOR & Anti-Enumeration Access Control', () => {
  const sampleAcademicGroup: GroupLike = {
    _id: '65f1a2b3c4d5e6f7a8b9c001',
    type: 'academic',
    members: ['usr_student_1', 'usr_student_2'],
    admins: ['usr_admin_1'],
    createdBy: 'usr_admin_1',
  };

  const samplePlacementGroup: GroupLike = {
    _id: '65f1a2b3c4d5e6f7a8b9c002',
    type: 'placement',
    members: ['usr_student_1'],
    admins: ['usr_tpo_lead'],
    createdBy: 'usr_tpo_lead',
  };

  const sampleHostelPrivateGroup: GroupLike = {
    _id: '65f1a2b3c4d5e6f7a8b9c003',
    type: 'hostel',
    members: ['usr_student_1', 'usr_student_hostel_lead'],
    admins: ['usr_student_hostel_lead'],
    createdBy: 'usr_student_hostel_lead',
  };

  test('denies access when user is not authenticated', () => {
    assert.equal(canAccessGroup(sampleAcademicGroup, null), false);
    assert.equal(canAccessGroup(sampleAcademicGroup, undefined), false);
  });

  test('denies access for null or non-existent group', () => {
    const user: JWTPayload = { userId: 'usr_student_1', role: 'student', email: 's@campus.edu', name: 'Student' };
    assert.equal(canAccessGroup(null, user), false);
  });

  test('denies access to authenticated non-members on private student groups', () => {
    const stranger: JWTPayload = { userId: 'usr_stranger_99', role: 'student', email: 'stranger@campus.edu', name: 'Stranger' };
    assert.equal(canAccessGroup(sampleHostelPrivateGroup, stranger), false);
    assert.equal(canPostToGroup(sampleHostelPrivateGroup, stranger), false);
  });

  test('grants access to enrolled group members', () => {
    const member: JWTPayload = { userId: 'usr_student_2', role: 'student', email: 's2@campus.edu', name: 'Member' };
    assert.equal(canAccessGroup(sampleAcademicGroup, member), true);
    assert.equal(canPostToGroup(sampleAcademicGroup, member), true);
  });

  test('grants access to group admin and creator', () => {
    const creator: JWTPayload = { userId: 'usr_admin_1', role: 'student', email: 'a1@campus.edu', name: 'Creator' };
    assert.equal(canAccessGroup(sampleAcademicGroup, creator), true);
    assert.equal(canPostToGroup(sampleAcademicGroup, creator), true);
  });

  test('grants faculty access to academic groups, but denies access to private hostel groups', () => {
    const faculty: JWTPayload = { userId: 'usr_faculty_42', role: 'faculty', email: 'prof@campus.edu', name: 'Professor' };
    assert.equal(canAccessGroup(sampleAcademicGroup, faculty), true);
    // Faculty should NOT have blanket bypass into private student hostel groups
    assert.equal(canAccessGroup(sampleHostelPrivateGroup, faculty), false);
  });

  test('grants TPO access to placement groups, but denies access to private hostel groups', () => {
    const tpo: JWTPayload = { userId: 'usr_tpo_officer', role: 'tpo', email: 'tpo@campus.edu', name: 'TPO Officer' };
    assert.equal(canAccessGroup(samplePlacementGroup, tpo), true);
    // TPO should NOT have blanket bypass into private student hostel groups
    assert.equal(canAccessGroup(sampleHostelPrivateGroup, tpo), false);
  });
});
