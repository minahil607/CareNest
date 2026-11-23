# CareCircle Firestore Security Specification (Phase 0)

## 1. Data Invariants
1. **Strict Ownership Isolation**: All user data lives under `/users/{userId}/...`. Only an authenticated, email-verified user whose `request.auth.uid == userId` may read or write their documents.
2. **Master Gate**: All subcollections under `/users/{userId}/...` verify that the parent `/users/{userId}` root document exists before allowing writes.
3. **Immutable Ownership & Creation Timestamps**: `ownerId` and `createdAt` cannot be modified after creation. `createdAt` and `updatedAt` must equal `request.time`.
4. **Strict Schema & Bounds**: Every write validates required fields, disallows shadow/unknown fields (`hasOnly`), and bounds every string length and numeric range.
5. **No Blanket Reads or Queries**: `allow list` validates `resource.data.ownerId == request.auth.uid` on every subcollection without calling `get()` or `exists()`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated read** on `/users/uid1/medications/med1` -> `PERMISSION_DENIED`.
2. **Cross-user read** by `uid2` on `/users/uid1/profile/main` -> `PERMISSION_DENIED`.
3. **Unverified email write** (`email_verified: false`) on `/users/uid1/medications/med1` -> `PERMISSION_DENIED`.
4. **Owner spoofing** (`ownerId: "uid2"`) when `uid1` creates `/users/uid1/tasks/t1` -> `PERMISSION_DENIED`.
5. **Shadow field injection** (`isAdmin: true`) during create on `/users/uid1` -> `PERMISSION_DENIED`.
6. **Shadow field update** (`extraFlag: 1`) during update on `/users/uid1/medications/med1` -> `PERMISSION_DENIED`.
7. **Immutable `createdAt` tampering** on update of `/users/uid1/tasks/t1` -> `PERMISSION_DENIED`.
8. **Client-forged timestamp** (`createdAt: "2020-01-01"`) instead of server timestamp `request.time` -> `PERMISSION_DENIED`.
9. **Oversized string poisoning** (`name` > 100 chars or `message` > 600 chars) -> `PERMISSION_DENIED`.
10. **Invalid time bounds** (`timeHour: 29` or `timeMinute: -1`) on medication -> `PERMISSION_DENIED`.
11. **Malformed document ID** (`med$%bad` or >128 chars) -> `PERMISSION_DENIED`.
12. **Terminal lock / appointment date format bypass** (`dateISO: "not-a-date"`) -> `PERMISSION_DENIED`.
