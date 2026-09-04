import mongoose from 'mongoose';
import { JWTPayload } from '@/lib/auth';

export interface GroupLike {
  _id?: string | mongoose.Types.ObjectId;
  type?: 'academic' | 'placement' | 'sports' | 'cultural' | 'hostel' | 'general' | string;
  members?: (string | mongoose.Types.ObjectId)[];
  admins?: (string | mongoose.Types.ObjectId)[];
  createdBy?: string | mongoose.Types.ObjectId;
}

/**
 * Checks if a user is authorized to read messages or view details of a group.
 * Business rules:
 * - Group creator, admins, and explicit members always have access.
 * - TPO officers have oversight on 'placement' groups.
 * - Faculty members have oversight on 'academic' groups.
 * - Private student groups ('hostel', 'sports', 'cultural', 'general') are restricted
 *   strictly to enrolled members, admins, and the creator.
 */
export function canAccessGroup(group: GroupLike | null | undefined, user: JWTPayload | null | undefined): boolean {
  if (!group || !user || !user.userId) {
    return false;
  }

  const userIdStr = user.userId.toString();

  // 1. Direct membership, admin, or creator
  if (group.createdBy?.toString() === userIdStr) {
    return true;
  }

  if (group.admins?.some((a) => a?.toString() === userIdStr)) {
    return true;
  }

  if (group.members?.some((m) => m?.toString() === userIdStr)) {
    return true;
  }

  // 2. Scoped administrative / faculty oversight
  if (user.role === 'tpo' && group.type === 'placement') {
    return true;
  }

  if (user.role === 'faculty' && group.type === 'academic') {
    return true;
  }

  return false;
}

/**
 * Checks if a user is authorized to post messages to a group.
 * Uses the same scoped rules as canAccessGroup.
 */
export function canPostToGroup(group: GroupLike | null | undefined, user: JWTPayload | null | undefined): boolean {
  return canAccessGroup(group, user);
}
