# Authentication implementation

The frontend uses `better-auth/react` from the installed Better Auth 1.7.7 package, matching the backend.

## Configuration

Copy `.env.sample` to `.env.local`. The defaults are:

- `VITE_API_BASE_URL=http://localhost:4000/api`
- `VITE_AUTH_BASE_URL=http://localhost:4000/api/auth`
- `VITE_SOCKET_URL=http://localhost:4000`

Auth and Axios requests include cookies. Configure production origins on the backend and use HTTPS. These Vite variables are public and must not contain secrets. The frontend stores no session tokens or passwords in local storage.

The shared authenticated header offers sign-out and an account security page at `/account`. Password changes require the current password, validate the replacement password, and request revocation of other sessions through Better Auth's `/change-password` endpoint. Password reset by email remains dependent on backend email configuration.

## Login and permissions

Accounts are provisioned by the server; public signup is disabled there. A user never chooses their role during login. Login uses `POST /api/auth/sign-in/email`, then verifies `GET /api/auth/get-session?disableCookieCache=true` before granting access. Session types are inferred from the matching client and admin plugin.

| Server role   | Landing route        | Permitted areas                     |
| ------------- | -------------------- | ----------------------------------- |
| admin         | /admin/dashboard     | admin, manager, frontdesk, services |
| manager       | /manager/dashboard   | manager, frontdesk, services        |
| front_desk    | /frontdesk/dashboard | frontdesk, services                 |
| service_staff | /services/dashboard  | services                            |
| guest         | /guest/dashboard     | guest                               |

Unknown/missing roles fail closed to the access-denied screen. Signed-out users visiting a protected route are sent to login. After login, a permitted internal destination is restored; otherwise the user's role determines the landing page. Manager/admin/guest/service dashboard screens provide navigation; business modules still contain their existing placeholders.

## Session lifecycle

The server session is restored on startup, rechecked on window focus and every minute, and checked for local expiry every second. Sign-out revokes the cookie-backed server session before clearing normal authenticated state; failures are visible and retryable. Protected content is hidden after 15 minutes without user activity. Other tabs receive auth-change and activity notifications through storage events; these notifications contain no credentials and never grant access without querying the server.

Session refresh responses are revision-checked to avoid overwriting newer login/logout state. Initial verification failures fail closed and expose a retry action. Business API 401 responses trigger session revalidation; requests, especially bookings/payments, are never automatically replayed.

Socket connections are established only for an authenticated user with a server-provided branch ID. They send cookies and disconnect when the user/branch changes or logs out. No fallback branch is guessed.

## Backend requirements and current limits

The current backend mounts Better Auth at `/api/auth`, configures the admin plugin, supports email/password login, and seeds admin/manager/front_desk accounts. Those accounts must actually exist in the database; the frontend has no demo-login bypass.

The backend does not currently expose branch membership on auth users or initialize Socket.io. Add a trusted branch field and validate room subscriptions server-side before enabling branch updates. All hotel REST endpoints must enforce authentication, roles and branch scope on the server; frontend route guards are not API authorization.

Password reset email delivery, MFA, failed-attempt lockout and server-enforced inactivity policy are not configured in the current backend. The frontend does not pretend these features are available. Its inactivity lock hides content locally, but server revocation can fail during an outage and requires a server policy for enforcement across reloads/devices. Guest and service staff are supported by the frontend permission policy but are not seeded by the existing backend script.

## Validation

Run `npm test`, `npm run build`, and `npm run lint`. The test command first checks the application's TypeScript types, including the configured auth client. Tests then exercise the actual modern Better Auth client against mocked HTTP responses, credential transport, session restoration/expiry/errors, logout failures, every role's permissions, and safe redirect selection. A live login requires a running backend and initialized MySQL; these mocked checks do not verify database or deployment configuration.

A live check against the existing local backend verified front-desk, manager and administrator logins with the expected server roles, front-desk session retrieval, and successful sign-out for all three accounts. A subsequent session lookup confirmed the front-desk session was revoked. Temporary test sessions were revoked. No account passwords were changed during verification.

Successful login always redirects to the server-assigned role’s dashboard: Admin → `/admin/dashboard`, Manager → `/manager/dashboard`, Front Desk → `/frontdesk/dashboard`. A previously requested page does not override this landing URL. Authorized navigation to other workspaces remains governed by the permission matrix.
