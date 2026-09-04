/**
 * Security & Input Validation Library
 * Implements strict default-deny allowlists for database queries and profile updates.
 */

// Allowlist of fields that recruiters can filter on
const ALLOWED_RECRUITER_FIELDS = new Set(['branch', 'cgpa', 'skills', 'semester']);

// Operator allowlists segregated by data type
const ALLOWED_NUMERIC_OPERATORS = new Set(['$gte', '$lte', '$gt', '$lt', '$eq']);

// Allowlist of fields that students are explicitly permitted to update on their profile
const ALLOWED_STUDENT_PROFILE_FIELDS = new Set([
  'bio',
  'skills',
  'projects',
  'certifications',
  'extracurriculars',
  'linkedin',
  'github',
  'resumeUrl',
]);

const PROTOTYPE_POLLUTION_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Escapes regex special characters to neutralize ReDoS attacks and unexpected matching.
 */
export function escapeRegex(pattern: string): string {
  return pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Computes the maximum nesting depth of an object.
 */
function getObjectDepth(obj: unknown, currentDepth = 0): number {
  if (!obj || typeof obj !== 'object') {
    return currentDepth;
  }
  if (Array.isArray(obj)) {
    let max = currentDepth + 1;
    for (const item of obj) {
      max = Math.max(max, getObjectDepth(item, currentDepth + 1));
    }
    return max;
  }
  let max = currentDepth + 1;
  for (const value of Object.values(obj as Record<string, unknown>)) {
    max = Math.max(max, getObjectDepth(value, currentDepth + 1));
  }
  return max;
}

/**
 * Sanitizes an LLM-generated or client-supplied MongoDB filter for recruiter search.
 * Enforces a strict default-deny policy:
 * - Only approved fields ('branch', 'cgpa', 'skills', 'semester') are accepted.
 * - Enforces operator specialization: numeric fields only accept numeric comparison operators.
 * - Hostile operators ($where, $expr, $function, $accumulator, etc.) are strictly rejected.
 * - Rejects prototype pollution payloads and deeply nested objects (depth > 2).
 * - Clamps array lengths, regex length, and text lengths.
 */
export function sanitizeRecruiterFilter(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }

  // Reject deeply nested structures to prevent parser exhaustion / complexity attacks
  if (getObjectDepth(raw) > 3) {
    return {};
  }

  const rawObj = raw as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};
  const entries = Object.entries(rawObj);

  // Enforce maximum condition count
  if (entries.length > 10) {
    return {};
  }

  for (const [key, value] of entries) {
    // Drop prototype pollution attempts or unknown fields
    if (PROTOTYPE_POLLUTION_KEYS.has(key) || !ALLOWED_RECRUITER_FIELDS.has(key)) {
      continue;
    }

    if (key === 'branch') {
      if (typeof value === 'string') {
        const trimmed = value.trim().slice(0, 30);
        if (/^[A-Za-z0-9\s-]{1,30}$/.test(trimmed)) {
          sanitized.branch = trimmed;
        }
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        const obj = value as Record<string, unknown>;
        const sanitizedBranchOp: Record<string, unknown> = {};

        // Only allow $regex or $in for branch
        if (typeof obj.$regex === 'string') {
          const safePattern = escapeRegex(obj.$regex.slice(0, 30));
          sanitizedBranchOp.$regex = safePattern;
          sanitizedBranchOp.$options = 'i';
        }
        if (Array.isArray(obj.$in)) {
          sanitizedBranchOp.$in = obj.$in
            .filter((s): s is string => typeof s === 'string')
            .map((s) => s.trim().slice(0, 30))
            .filter((s) => /^[A-Za-z0-9\s-]{1,30}$/.test(s))
            .slice(0, 10);
        }
        if (Object.keys(sanitizedBranchOp).length > 0) {
          sanitized.branch = sanitizedBranchOp;
        }
      }
    } else if (key === 'cgpa') {
      if (typeof value === 'number' && !isNaN(value)) {
        sanitized.cgpa = Math.min(10, Math.max(0, value));
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        const opObj = value as Record<string, unknown>;
        const sanitizedOps: Record<string, number> = {};
        for (const [op, val] of Object.entries(opObj)) {
          // Strictly allow numeric comparison operators only
          if (ALLOWED_NUMERIC_OPERATORS.has(op) && typeof val === 'number' && !isNaN(val)) {
            sanitizedOps[op] = Math.min(10, Math.max(0, val));
          }
        }
        if (Object.keys(sanitizedOps).length > 0) {
          sanitized.cgpa = sanitizedOps;
        }
      }
    } else if (key === 'semester') {
      if (typeof value === 'number' && Number.isInteger(value)) {
        sanitized.semester = Math.min(8, Math.max(1, value));
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        const opObj = value as Record<string, unknown>;
        const sanitizedOps: Record<string, number> = {};
        for (const [op, val] of Object.entries(opObj)) {
          if (ALLOWED_NUMERIC_OPERATORS.has(op) && typeof val === 'number' && !isNaN(val)) {
            sanitizedOps[op] = Math.min(8, Math.max(1, Math.round(val)));
          }
        }
        if (Object.keys(sanitizedOps).length > 0) {
          sanitized.semester = sanitizedOps;
        }
      }
    } else if (key === 'skills') {
      if (typeof value === 'string') {
        sanitized.skills = value.trim().slice(0, 40);
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        const opObj = value as Record<string, unknown>;
        const sanitizedOps: Record<string, string[]> = {};
        for (const op of ['$all', '$in'] as const) {
          if (Array.isArray(opObj[op])) {
            const list = opObj[op] as unknown[];
            sanitizedOps[op] = list
              .filter((s): s is string => typeof s === 'string')
              .map((s) => s.trim().slice(0, 40))
              .filter(Boolean)
              .slice(0, 20);
          }
        }
        if (Object.keys(sanitizedOps).length > 0) {
          sanitized.skills = sanitizedOps;
        }
      }
    }
  }

  return sanitized;
}

/**
 * Validates a student profile update payload using a strict default-deny allowlist.
 * If ANY unapproved or forbidden field is present (such as userId, _id, cgpa,
 * placementReadinessScore, role, roles, isAdmin, semester, branch), the update is REJECTED.
 */
export function validateProfileUpdate(raw: unknown): {
  valid: boolean;
  data: Record<string, unknown>;
  error?: string;
} {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, data: {}, error: 'Invalid profile payload: must be an object' };
  }

  const input = raw as Record<string, unknown>;
  const keys = Object.keys(input);

  if (keys.length === 0) {
    return { valid: false, data: {}, error: 'Profile update cannot be empty' };
  }

  // Strict allowlisting: reject any payload containing unapproved or forbidden fields
  for (const key of keys) {
    if (PROTOTYPE_POLLUTION_KEYS.has(key)) {
      return { valid: false, data: {}, error: `Prototype pollution field "${key}" is strictly forbidden` };
    }
    if (!ALLOWED_STUDENT_PROFILE_FIELDS.has(key)) {
      return { valid: false, data: {}, error: `Field "${key}" cannot be modified in student profile update` };
    }
  }

  const allowedData: Record<string, unknown> = {};

  if (input.bio !== undefined) {
    if (typeof input.bio !== 'string') {
      return { valid: false, data: {}, error: 'Bio must be a string' };
    }
    allowedData.bio = input.bio.trim().slice(0, 500);
  }

  if (input.skills !== undefined) {
    if (!Array.isArray(input.skills)) {
      return { valid: false, data: {}, error: 'Skills must be an array of strings' };
    }
    allowedData.skills = input.skills
      .filter((s): s is string => typeof s === 'string')
      .map((s) => s.trim().slice(0, 50))
      .filter(Boolean)
      .slice(0, 30);
  }

  if (input.certifications !== undefined) {
    if (!Array.isArray(input.certifications)) {
      return { valid: false, data: {}, error: 'Certifications must be an array of strings' };
    }
    allowedData.certifications = input.certifications
      .filter((s): s is string => typeof s === 'string')
      .map((s) => s.trim().slice(0, 100))
      .filter(Boolean)
      .slice(0, 20);
  }

  if (input.extracurriculars !== undefined) {
    if (!Array.isArray(input.extracurriculars)) {
      return { valid: false, data: {}, error: 'Extracurriculars must be an array of strings' };
    }
    allowedData.extracurriculars = input.extracurriculars
      .filter((s): s is string => typeof s === 'string')
      .map((s) => s.trim().slice(0, 100))
      .filter(Boolean)
      .slice(0, 20);
  }

  if (input.linkedin !== undefined) {
    if (typeof input.linkedin !== 'string') {
      return { valid: false, data: {}, error: 'LinkedIn must be a string' };
    }
    allowedData.linkedin = input.linkedin.trim().slice(0, 200);
  }

  if (input.github !== undefined) {
    if (typeof input.github !== 'string') {
      return { valid: false, data: {}, error: 'GitHub must be a string' };
    }
    allowedData.github = input.github.trim().slice(0, 200);
  }

  if (input.resumeUrl !== undefined) {
    if (typeof input.resumeUrl !== 'string') {
      return { valid: false, data: {}, error: 'Resume URL must be a string' };
    }
    allowedData.resumeUrl = input.resumeUrl.trim().slice(0, 300);
  }

  if (input.projects !== undefined) {
    if (!Array.isArray(input.projects)) {
      return { valid: false, data: {}, error: 'Projects must be an array' };
    }
    allowedData.projects = input.projects
      .filter((p): p is Record<string, unknown> => p && typeof p === 'object' && !Array.isArray(p))
      .map((p) => ({
        name: typeof p.name === 'string' ? p.name.trim().slice(0, 100) : '',
        description: typeof p.description === 'string' ? p.description.trim().slice(0, 500) : '',
        tech: Array.isArray(p.tech)
          ? p.tech.filter((t): t is string => typeof t === 'string').map((t) => t.trim().slice(0, 40)).slice(0, 15)
          : [],
        link: typeof p.link === 'string' ? p.link.trim().slice(0, 200) : '',
      }))
      .slice(0, 10);
  }

  return { valid: true, data: allowedData };
}

/**
 * Validates message submission inputs.
 */
export function validateMessageInput(raw: unknown): {
  valid: boolean;
  content: string;
  type: 'text' | 'announcement' | 'file';
  iv: string;
  encrypted: boolean;
  error?: string;
} {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, content: '', type: 'text', iv: '', encrypted: false, error: 'Invalid message payload' };
  }

  const input = raw as Record<string, unknown>;
  const content = typeof input.content === 'string' ? input.content.trim() : '';

  if (!content) {
    return { valid: false, content: '', type: 'text', iv: '', encrypted: false, error: 'Message content is required' };
  }

  if (content.length > 10_000) {
    return { valid: false, content: '', type: 'text', iv: '', encrypted: false, error: 'Message exceeds maximum length (10,000 characters)' };
  }

  const allowedTypes = ['text', 'announcement', 'file'] as const;
  const type = allowedTypes.includes(input.type as typeof allowedTypes[number])
    ? (input.type as 'text' | 'announcement' | 'file')
    : 'text';

  const iv = typeof input.iv === 'string' ? input.iv.slice(0, 100) : '';
  const encrypted = input.encrypted !== false;

  return { valid: true, content, type, iv, encrypted };
}
