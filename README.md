# HRGMS — Hotel & Restaurant Guest Management System

A full-stack hotel management system with role-based access control, real-time updates, and comprehensive booking, billing, and reporting features.

---

## Architecture Overview

| Layer | Technology | Status |
|-------|------------|--------|
| **Backend** | Node.js + Express + MySQL (mysql2 pool) | 🟡 Core infrastructure only |
| **Frontend** | React 19 + TypeScript + Vite + Tailwind CSS | 🟢 Most pages implemented (mock data) |
| **Database** | MySQL 8+ | ⚪ Not migrated |
| **Real-time** | Socket.io | 🟡 Frontend ready, backend not connected |
| **Auth** | JWT + Refresh tokens + TOTP MFA (planned) | 🔴 Hardcoded demo credentials only |

---

## Project Structure

```
HRGMS/
├── backend/backend/          # Express API server
│   ├── src/
│   │   ├── config/           # db.js (mysql2 pool), env.js (empty)
│   │   ├── middleware/       # 5 files - ALL EMPTY
│   │   ├── utils/            # 4 files - ALL EMPTY
│   │   ├── modules/          # Empty - no business logic yet
│   │   ├── app.js            # Express app with /api/health
│   │   └── server.js         # Entry point, Socket.io TODO
│   └── package.json
├── frontend/frontend/        # React + Vite + Tailwind
│   ├── src/
│   │   ├── api/              # 6 API clients (auth, billing, reservation, service, report, user)
│   │   ├── context/          # AuthContext (hardcoded), SocketContext
│   │   ├── routes/           # AppRouter, ProtectedRoute (role-based)
│   │   ├── pages/
│   │   │   ├── auth/         # LoginPage (demo creds)
│   │   │   ├── frontdesk/    # 6 pages (Dashboard, Reservations, CheckInOut, etc.)
│   │   │   └── manager/      # 6 pages (Dashboard, Reports, Services, Rooms, Users, Audit)
│   │   ├── App.tsx / main.tsx
│   └── package.json
└── plan/                     # Design documents (4 phases)
    ├── 0_HRGSMS_Project_Initialization.md
    ├── 1_HRGSMS_Database_Design.md      # 18-table schema
    ├── 2_HRGSMS_Backend_Design.md       # 7-phase implementation plan
    └── 3_HRGSMS_Frontend_Design.md      # Page/component specs
```

---

## What Has Been Done ✅

### Backend (`backend/backend/`)
- [x] Project initialized with `package.json` and all runtime dependencies
- [x] Express app with `helmet`, `cors`, `express.json()`
- [x] Health check endpoint: `GET /api/health` → `{status: "ok"}`
- [x] MySQL connection pool configured in `src/config/db.js`
- [x] Folder structure created matching design docs:
  - `src/config/` — db.js, env.js
  - `src/middleware/` — auth, rbac, branchScope, audit, error
  - `src/utils/` — jwt, mfa, password, response
  - `src/modules/` — auth, access-control, reservations, services, billing, reporting
  - `src/sockets/` — (directory exists)
- [x] Dev scripts: `npm run dev` (nodemon), `npm run start`, `npm run migrate`

### Frontend (`frontend/frontend/`)
- [x] Vite + React 19 + TypeScript + Tailwind CSS initialized
- [x] Oxlint + Prettier configured
- [x] **API layer** — 6 typed API clients with axios interceptors (token attach, 401 refresh retry)
- [x] **AuthContext** — Role-based login with hardcoded demo credentials:
  - Admin: `admin@hotel.com` / `admin123`
  - Manager: `manager@hotel.com` / `manager123`
  - Front Desk: `frontdesk@hotel.com` / `frontdesk123`
- [x] **ProtectedRoute** — Role-based route guards (FrontDesk/ServiceStaff → `/frontdesk/*`, Manager/Admin → `/manager/*`)
- [x] **SocketContext** — Socket.io client with branch-room joining
- [x] **Pages implemented** (all with mock data):
  - `/login` — Unified login page
  - `/frontdesk/dashboard` — Arrivals, departures, occupancy, real-time socket listeners
  - `/frontdesk/reservations` — List with filters
  - `/frontdesk/reservations/new` — Create booking
  - `/frontdesk/reservations/:id` — Detail view with actions
  - `/frontdesk/check-in-out` — ID verification + room assignment
  - `/frontdesk/payment-processing` — Outstanding balance + payment
  - `/frontdesk/service-requests` — Queue with "Mark Completed"
  - `/manager/dashboard` — KPI summary (occupancy, revenue, pending services, outstanding)
  - `/manager/reports` — Report selector + export buttons
  - `/manager/services` — Service catalogue CRUD + price update
  - `/manager/rooms` — Room/room type/amenity management
  - `/manager/users` — Staff user management (Admin only)
  - `/manager/audit-logs` — Filterable audit log viewer (Admin only)
- [x] **Common components** — Button, Table, FormInput, Modal, LoadingSpinner, ErrorBanner
- [x] **Hooks** — `useForm` for controlled forms

### Design Documentation (`plan/`)
- [x] Complete database schema (18 tables) with all column types, indexes, and relations
- [x] Backend implementation plan: 7 phases, 6 modules, middleware, utils, sockets
- [x] Frontend implementation plan: Pages, components, API clients, build order matching backend phases

---

## What Needs To Be Done 🔴🟡🟢

### Phase 0 — Database & Prisma Setup (BLOCKER for backend)
- [ ] **Switch from mysql2 pool to Prisma ORM** (design docs specify Prisma)
- [ ] Install Prisma: `npm install -D prisma && npx prisma init --datasource-provider mysql`
- [ ] Create `prisma/schema.prisma` from `plan/1_HRGSMS_Database_Design.md` (18 models)
- [ ] Configure `.env` with `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, Stripe/Twilio keys
- [ ] Run `npx prisma migrate dev --name init`
- [ ] Verify with `npx prisma studio`

### Phase 1 — Auth & Access Control (Backend)
- [ ] Implement `utils/password.js` — bcrypt hash/verify
- [ ] Implement `utils/jwt.js` — sign/verify access (15min) + refresh (7d) tokens
- [ ] Implement `utils/mfa.js` — TOTP secret generation + verification (otplib)
- [ ] Implement `utils/response.js` — sendSuccess/sendError helpers
- [ ] Implement `middleware/auth.middleware.js` — JWT verification, attaches `req.user`
- [ ] Implement `middleware/rbac.middleware.js` — `requireRole(...roles)`
- [ ] Implement `middleware/branchScope.middleware.js` — enforce branch isolation
- [ ] Implement `middleware/audit.middleware.js` — `withAudit(action, entityType)` wrapper
- [ ] Implement `middleware/error.middleware.js` — centralized error handler
- [ ] Build `modules/auth/` — validation, service, controller, routes
  - `POST /api/auth/register` (guest)
  - `POST /api/auth/login` (guest + staff, MFA challenge for Manager/Admin)
  - `POST /api/auth/mfa/verify`
  - `POST /api/auth/forgot-password`
  - [ ] `POST /api/auth/reset-password`
  - [ ] `POST /api/auth/refresh`
  - [ ] `POST /api/auth/logout`
- [ ] Build `modules/access-control/` — user CRUD (Admin), audit log read (Admin)
  - `POST /api/users` (Admin)
  - `GET /api/users` (Admin/Manager, branch-scoped)
  - `PATCH/DELETE /api/users/:id` (Admin)
  - `GET /api/audit-logs` (Admin)

### Phase 2 — Reservations (Backend)
- [ ] Build `modules/reservations/` — branch, roomType, room, booking services
- [ ] `GET /api/rooms/availability` — availability check with date overlap query
- [ ] `POST /api/bookings` — transactional booking creation with double-booking prevention
- [ ] `POST /api/bookings/:id/check-in` — requires guest ID verification
- [ ] `POST /api/bookings/:id/check-out` — requires `OutstandingAmount == 0`
- [ ] `POST /api/bookings/:id/cancel` — cancellation policy logic
- [ ] Socket events: `availability-changed`, `new-arrival`, `new-departure`

### Phase 3 — Services (Backend)
- [ ] Build `modules/services/` — service catalogue + usage
- [ ] `GET /api/services` — catalogue listing
- [ ] `POST /api/service-requests` — guest/staff request service
- [ ] `PATCH /api/service-requests/:id/complete` — staff marks completed, adds to bill
- [ ] Socket event: `service-request-update`

### Phase 4 — Billing (Backend)
- [ ] Build `modules/billing/` — billing service + payment + notifications
- [ ] Stored procedure `sp_calculate_bill` (room nights × rate + services + tax)
- [ ] `GET /api/bookings/:id/bill` — itemized bill
- [ ] `POST /api/bookings/:id/payment-intent` — Stripe payment intent
- [ ] `POST /api/bookings/:id/payments` — confirm payment, update outstanding
- [ ] `GET /api/payments/outstanding` — overdue balances + reminders
- [ ] Twilio notifications (SMS/email) for booking confirmation, payment reminder, check-in reminder
- [ ] Socket event: `payment-confirmed`

### Phase 5 — Reporting (Backend)
- [ ] Build `modules/reporting/` — occupancy, billing, service usage, revenue reports
- [ ] Export: PDF (pdfkit), Excel (exceljs), CSV
- [ ] Scheduled reports via `node-cron`

### Phase 6 — Real-Time Layer (Backend)
- [ ] `sockets/index.js` — Socket.io server, JWT auth, branch-room joining
- [ ] `sockets/availability.socket.js` — emit availability changes
- [ ] `sockets/notification.socket.js` — emit service/payment updates

### Frontend Integration (After each backend phase)
- [ ] Replace hardcoded AuthContext with real API calls (`authApi.login`, `verifyMfa`, `refresh`)
- [ ] Connect all API clients to real endpoints
- [ ] Replace mock data in pages with actual API calls
- [ ] Add loading/error states throughout
- [ ] Implement Stripe Elements checkout in `MyBillPage` / `PaymentProcessingPage`
- [ ] Test Socket.io real-time updates end-to-end

### Cross-Cutting
- [ ] Add ESLint/Prettier configs to backend (match frontend)
- [ ] Add integration tests for critical flows (booking, check-in/out, payment)
- [ ] Add CI/CD pipeline
- [ ] Production deployment configs (Docker, env vars, reverse proxy)

---

## Quick Start

### Backend
```bash
cd backend/backend
cp .env.example .env  # Configure DATABASE_URL, JWT secrets, etc.
npm install
npm run migrate       # After Prisma setup
npm run dev           # http://localhost:4000/api/health
```

### Frontend
```bash
cd frontend/frontend
cp .env.example .env  # Configure VITE_API_BASE_URL, VITE_STRIPE_PUBLISHABLE_KEY
npm install
npm run dev           # http://localhost:5173
```

### Demo Login (Frontend Only)
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hotel.com | admin123 |
| Manager | manager@hotel.com | manager123 |
| Front Desk | frontdesk@hotel.com | frontdesk123 |

---

## Design Doc Traceability

Every backend function and frontend page maps to a specific SRS requirement:

| Module | SRS Section | Design Doc |
|--------|-------------|------------|
| Auth | §4.1 | `plan/2` Phase 1 |
| Access Control | §4.6 | `plan/2` Phase 1 |
| Reservations | §4.2 | `plan/2` Phase 2 |
| Services | §4.3 | `plan/2` Phase 3 |
| Billing | §4.4 | `plan/2` Phase 4 |
| Reporting | §4.5 | `plan/2` Phase 5 |
| Real-Time | §3.4 | `plan/2` Phase 6 |

---

## License

Internal project — HRGMS team.