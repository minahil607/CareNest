// Phase 0 Security Specification Test Matrix for CareCircle Firestore Rules.
// Verifies that each "Dirty Dozen" adversarial payload violates the hardened rules invariants.

export interface DirtyDozenCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  expectedOutcome: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_CASES: DirtyDozenCase[] = [
  { id: 1, name: 'Unauthenticated read', operation: 'get', path: '/users/uid1/medications/med1', expectedOutcome: 'PERMISSION_DENIED' },
  { id: 2, name: 'Cross-user PII read', operation: 'get', path: '/users/uid1/profile/main', expectedOutcome: 'PERMISSION_DENIED' },
  { id: 3, name: 'Unverified email write', operation: 'create', path: '/users/uid1/medications/med1', expectedOutcome: 'PERMISSION_DENIED' },
  { id: 4, name: 'Owner ID spoofing', operation: 'create', path: '/users/uid1/tasks/task1', expectedOutcome: 'PERMISSION_DENIED' },
  { id: 5, name: 'Shadow field on user root create', operation: 'create', path: '/users/uid1', expectedOutcome: 'PERMISSION_DENIED' },
  { id: 6, name: 'Shadow field on medication update', operation: 'update', path: '/users/uid1/medications/med1', expectedOutcome: 'PERMISSION_DENIED' },
  { id: 7, name: 'Immutable createdAt mutation', operation: 'update', path: '/users/uid1/tasks/task1', expectedOutcome: 'PERMISSION_DENIED' },
  { id: 8, name: 'Client-forged timestamp', operation: 'create', path: '/users/uid1/careUpdates/upd1', expectedOutcome: 'PERMISSION_DENIED' },
  { id: 9, name: 'Oversized string payload', operation: 'create', path: '/users/uid1/medications/med1', expectedOutcome: 'PERMISSION_DENIED' },
  { id: 10, name: 'Out-of-range hour/minute', operation: 'create', path: '/users/uid1/medications/med1', expectedOutcome: 'PERMISSION_DENIED' },
  { id: 11, name: 'Malformed document ID', operation: 'create', path: '/users/uid1/tasks/bad$id', expectedOutcome: 'PERMISSION_DENIED' },
  { id: 12, name: 'Invalid appointment dateISO', operation: 'create', path: '/users/uid1/appointments/appt1', expectedOutcome: 'PERMISSION_DENIED' },
];
