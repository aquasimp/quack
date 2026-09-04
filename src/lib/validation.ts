/**
 * Security & Input Validation Library
 * Implements default-deny allowlists for database queries and user updates.
 */

// Allowlist of fields that recruiters can filter on
const ALLOWED_RECRUITER_FIELDS = new Set(['branch', 'cgpa', 'skills', 'semester']);

// Allowlist of safe MongoDB query operators
const ALLOWED_QUERY_OPERATORS = new Set([
  '$gte',
  '$lte',
  '$gt',
  '$lt',
  '$eq',
  '$in',
  '$all',
  '$regex',
]);

/**
 * Escapes regex special characters to neutralize ReDoS attacks.
 */
export function escapeRegex(pattern: string): string {
  return pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitizes an LLM-generated or client-supplied MongoDB filter for recruiter search.
 * Enforces a strict default-deny policy:
 * - Only approved fields ('branch', 'cgpa', 'skills', 'semester') are accepted.
 * - Only safe operators ('$gte', '$lte', '$gt', '$lt', '$eq', '$in', '$all', '$regex') are allowed.
 * - Hostile operators ($where, $expr, $function, etc.) are strictly rejected.
 * - Regex inputs are clamped to 30 characters and sanitized.
 */
export function sanitizeRecruiterFilter(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }

  const sanitized: Record<string, unknown> = {};
  const entries = Object.entries(raw as Record<string, unknown>);

  for (const [key, value] of entries) {
    if (!ALLOWED_RECRUITER_FIELDS.has(key)) {
      // Default-deny: skip any unrecognized or unauthorized field
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
        if (typeof obj.$regex === 'string') {
          // Clamp regex pattern and escape dangerous characters
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
          if (ALLOWED_QUERY_OPERATORS.has(op) && typeof val === 'number' && !isNaN(val)) {
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
          if (ALLOWED_QUERY_OPERATORS.has(op) && typeof val === 'number' && !isNaN(val)) {
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
 * Validates and sanitizes a user profile update payload.
 * Strictly prevents mass-assignment of sensitive fields like userId, _id, placementReadinessScore.
 */
export function validateProfileUpdate(raw: unknown): {
  valid: boolean;
  data: Record<string, unknown>;
  error?: string;
} {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, data: {}, error: 'Invalid profile payload' };
  }

  const input = raw as Record<string, unknown>;
  const allowedData: Record<string, unknown> = {};

  if (typeof input.branch === 'string') {
    allowedData.branch = input.branch.trim().slice(0, 50);
  }

  if (typeof input.semester === 'number' && !isNaN(input.semester)) {
    allowedData.semester = Math.min(8, Math.max(1, Math.round(input.semester)));
  }

  if (typeof input.cgpa === 'number' && !isNaN(input.cgpa)) {
    allowedData.cgpa = Math.min(10, Math.max(0, parseFloat(input.cgpa.toFixed(2))));
  }

  if (Array.isArray(input.skills)) {
    allowedData.skills = input.skills
      .filter((s): s is string => typeof s === 'string')
      .map((s) => s.trim().slice(0, 50))
      .filter(Boolean)
      .slice(0, 30);
  }

  if (Array.isArray(input.certifications)) {
    allowedData.certifications = input.certifications
      .filter((s): s is string => typeof s === 'string')
      .map((s) => s.trim().slice(0, 100))
      .filter(Boolean)
      .slice(0, 20);
  }

  if (Array.isArray(input.extracurriculars)) {
    allowedData.extracurriculars = input.extracurriculars
      .filter((s): s is string => typeof s === 'string')
      .map((s) => s.trim().slice(0, 100))
      .filter(Boolean)
      .slice(0, 20);
  }

  if (typeof input.bio === 'string') {
    allowedData.bio = input.bio.trim().slice(0, 500);
  }

  if (typeof input.linkedin === 'string') {
    allowedData.linkedin = input.linkedin.trim().slice(0, 200);
  }

  if (typeof input.github === 'string') {
    allowedData.github = input.github.trim().slice(0, 200);
  }

  if (typeof input.resumeUrl === 'string') {
    allowedData.resumeUrl = input.resumeUrl.trim().slice(0, 300);
  }

  if (Array.isArray(input.projects)) {
    allowedData.projects = input.projects
      .filter((p): p is Record<string, unknown> => p && typeof p === 'object')
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
  if (!raw || typeof raw !== 'object') {
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
