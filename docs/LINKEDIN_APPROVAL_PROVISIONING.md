# LinkedIn approval provisioning readiness

## Current supported mechanism

Approval authorization uses the existing server-side GreenNext session system:

1. An authenticated session is read from the `greennext_session` cookie.
2. The session is validated against the existing Redis-backed session store.
3. The session `userId` must be present in `LINKEDIN_APPROVER_USER_IDS`.
4. The session `role` must be present in `LINKEDIN_APPROVER_ROLES` (default: `approver,admin`).

A valid GreenNext session alone is not sufficient. LinkedIn approval remains
disabled when the approver user-ID allow-list is empty.

## Provisioning status

The repository does not contain a login provider, account-management screen, or
approved approver-provisioning endpoint. `createSession` is a server-side
session primitive, not an identity-verification or role-assignment workflow.
The Redis demo session helpers are also not an acceptable provisioning path.

Therefore no user ID or role has been invented or assigned by this phase.

## Smallest safe next step

An authorized project owner must first select the existing GreenNext identity
provider and establish how its verified user identifier and role are mapped into
the Redis session record. After that identity source is approved, configure the
allow-list and roles through the deployment secret manager, using fresh rotated
credentials where required. Do not create a session or grant an approver role
from a client request, webhook, JIRA transition, or the demo route.

This phase makes no account, role, Redis, JIRA, Vercel, or production changes.

## Storage requirement

Production proposal and session persistence must remain Redis-backed. The
in-memory proposal store is test-only and is never selected by the production
request handlers. A safe Redis connectivity check must be run only after fresh,
authorized credentials are provisioned; credentials must not be placed in this
document, source code, logs, or test output.
