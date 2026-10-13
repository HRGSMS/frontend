# HRGMS — Hotel Reservation and Guest Services Management

Frontend for SkyNest hotel operations, built with React, TypeScript, Vite and Tailwind CSS.

## Getting started

Use Node.js 24 or newer for the current build and test tooling.

```bash
npm install
cp .env.sample .env.local
npm run dev
```

The frontend runs at `http://localhost:5173`. The backend defaults to `http://localhost:4000` and must be running with its authentication database initialized.

## Configuration

| Variable                    | Default                        | Purpose                                 |
| --------------------------- | ------------------------------ | --------------------------------------- |
| VITE_API_BASE_URL           | http://localhost:4000/api      | Hotel REST API                          |
| VITE_AUTH_BASE_URL          | http://localhost:4000/api/auth | Better Auth endpoints                   |
| VITE_SOCKET_URL             | http://localhost:4000          | Socket.io server                        |
| VITE_STRIPE_PUBLISHABLE_KEY | Placeholder in .env.sample     | Reserved for future payment integration |

Vite environment values are public. Server credentials and secrets belong in the backend configuration.

## Current implementation

- Email/password authentication with Better Auth cookie sessions.
- Server-assigned roles, role-specific landing pages and protected routes.
- Session restoration, expiry checks, local inactivity handling and cross-tab notifications.
- Password changes with revocation of other sessions.
- Shared authenticated navigation and sign-out.
- Front desk dashboard with sample operational data and socket listeners.
- Reservation, check-in/out, payment and service screens currently contain placeholders.
- Manager/admin screens provide navigation and placeholder modules.
- Guest/service staff have separate access policies; the guest portal is not implemented.
- Axios wrappers for reservations, billing, services and reporting; business screens are not yet connected to them.

See [Authentication implementation](BETTERAUTH_LOGIN_IMPLEMENTATION.md) for the role matrix, endpoint contract, session behavior and backend requirements. Accounts must be provisioned on the server; public signup is disabled.

## Source layout

```text
src/
  api/          Cookie-authenticated HTTP client and hotel API wrappers
  components/   Shared authenticated layout
  context/      Auth/socket providers, state and hooks
  lib/          Auth client, session validation, permissions and configuration
  pages/        Login, account security, dashboards and hotel screens
  routes/       Application routes and access guards
tests/
  auth.test.mjs Authentication contract and permission regression checks
```

Visual references are stored in `public/stitch-screens/`; they are design assets, not application routes.


```bash
npm test
npm run build
npm run lint
npm run format:check
```

Tests use the actual Better Auth client against mocked HTTP responses. They do not require the backend and do not replace live browser/database verification.

## Remaining integration work

Implement hotel workflows and connect their APIs. Enforce authentication, permissions and branch scope on the backend. Socket subscriptions require trusted branch membership and a running Socket.io server. Email password reset, MFA, lockout and server-side inactivity enforcement also require backend configuration.

## License

Internal project — HRGMS team.
