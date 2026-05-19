# Vox MONO Security Specification

## Data Invariants
1. A user can only access their own tasks, settings, and focus sessions.
2. `userId` in any document must match the authenticated `request.auth.uid`.
3. `createdAt` must be set to the server timestamp.
4. Identifiers must be alphanumeric with dashes or underscores.

## The Dirty Dozen Payloads (Rejection Tests)
1. Creating a task for a different `userId`.
2. Updating a task to belong to a different `userId`.
3. Reading all tasks (blanket query).
4. Injecting a 1MB string into a task `title`.
5. Setting a future `createdAt` timestamp from the client.
6. Modifying another user's settings.
7. Creating a task with an ID that is a 10KB junk string.
8. Updating a task's `id` field (immutable).
9. Updating `userId` in settings.
10. Creating a task without a `title`.
11. Reading a specific session document without being the owner.
12. Attempting to batch write a task for another user alongside a legitimate one.

## Implementation Plan
- Use `isValidTask` and `isValidSettings` helpers.
- Use `isValidId` for path variables.
- Enforce `request.auth.uid == userId` at the root of `match /users/{userId}`.
