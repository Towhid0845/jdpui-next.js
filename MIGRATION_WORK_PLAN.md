# Migration Work Plan

Last updated: 2026-04-02

## Phases and Status

### Phase 0 — Setup and Baseline
- [x] Confirm target project path and migration baseline
- [x] Create and maintain this work plan file
- [x] Define migration conventions (routing, auth roles, API base)
- [x] Sync environment values from Angular into local env files

### Phase 1 — Auth / Session
- [ ] Map Angular auth flows (email, phone/OTP, 2FA, social, external login)
- [x] Implement backend auth integration in client auth service
- [x] Convert auth/session to client-only
- [x] Map accountType + roles into client session
- [x] Update sign-in UI to use real auth flow (remove demo defaults)
- [x] Verify sign-in end-to-end (client auth)
- [x] Update sign-up UI to match backend Register payload (email/password)
- [x] Implement forgot/reset password flow
- [x] Implement external login route flow

### Phase 2 — Layout / Navigation
- [x] Map Angular navigation to Fuse navigation config
- [x] Define role-to-navigation mapping for account types
- [x] Integrate navigation into Fuse layouts
- [x] Confirm public vs control-panel layouts

### Phase 3 — API Base
- [x] Create API client for Jobdesk backend (base URL, headers, error handling)
- [x] Implement auth API (login, register, forgot/reset)
- [x] Implement user profile fetch (GetUserInfoByEmail/Phone)
- [x] Implement shared system data store (typeInfos + culture)
- [x] API services created for all modules (17 service files)

### Phase 4 — Core Modules (post-initial)
- [x] Dashboard (real API data + account-type layouts)
- [x] Settings page (/settings) — Personal, Account, Users tabs
- [x] Vacancy Manager (/vacancy-manager) — list, filter, search, CRUD actions, chart stats
- [x] Candidates Overview (/candidates/overview) — list, search, status filter, add/delete/invite
- [x] Online Profiles (/candidates/profiles) — search, stats cards, country/language filters, profile grid
- [x] Profile Detail (/candidates/profiles/:id) — full profile view with sections
- [x] Job Market (/job-market) — stats cards, search, location/sector/type filters, job list, detail dialog

### Phase 5 — Secondary Modules
- [x] Online Vacancies (/online-vacancies) — infinite scroll, filters, detail, apply, admin actions
- [x] Clients & Contacts (/clients) — list, search, pagination
- [x] Services (/services) — seller services list with search
- [x] Orders (/orders) — seller/recruiter orders list
- [x] Employees — Attendance (/employees/attendance) + Notice Board (/employees/notice_board)
- [x] Calendar (/calendar) — event list, add/delete events
- [x] Todo (/todos) — todo list with add/toggle/delete
- [x] Service Notifications (/services/notifications)
- [x] My Profiles (/my-profiles) — candidate profiles list
- [x] My Proposals (/my-proposals) — candidate proposals list
- [x] Client Proposals (/client-proposals) — company proposals list
- [x] Candidate Orders (/candidates/orders) — purchases list

### Phase 6 — Admin & Long-tail
- [x] Admin Panel (/admin) — user management, role management
- [x] Learning Resources (/learning-resources) — resources list
- [x] Transaction History (/transaction-history/:filter) — transactions list
- [ ] JD Culture Settings (admin-only, deferred — requires culture translation UI)
- [ ] Promotions (deferred — no clear Angular module to migrate)
- [ ] File Manager (deferred — requires file upload/download infrastructure)
- [ ] Advanced Settings / App Test (deferred — admin tooling)

### Phase 7 — QA and Cleanup
- [x] Route parity verified — all nav config routes have matching pages (except disabled /profile-leads)
- [x] Permissions/roles — AuthGuardRedirect on (control-panel) layout, role-based nav config
- [ ] Smoke tests and regression checks (requires running dev server)
- [ ] Remove migration scaffolding (old_proj reference)

## API Services Created (17 files)
- auth.ts, user.ts, dashboard.ts, notifications.ts, onlineVacancies.ts, userSettings.ts
- typeInfos.ts, culture.ts, geo.ts
- vacancies.ts, candidates.ts, profiles.ts, contacts.ts
- sellers.ts, employees.ts, calendar.ts, todos.ts
- learning.ts, admin.ts, transactions.ts

## Route Summary (23 protected pages + 7 public pages)
All navigation config routes are covered. Disabled routes (/profile-leads, /sellers) intentionally excluded.

## Remaining Owner-Decision Items
- Confirm when to enable OTP / 2FA / external login / social login beyond email/password
- JD Culture Settings, Promotions, File Manager — confirm if these should be implemented
- Profile Leads — currently disabled in nav; confirm if it should be enabled

## Assumptions
- Backend API base URL is set via `API_BASE_URL` (single base URL).
- Access token returned by `/api/Login` is used as Bearer token for API calls.
- `source_resources` is design-only; any needed templates/components must be copied into `src` and never imported directly.
- AccountType mapping: 1=recruiter, 2=candidate, 3=company, 4=seller.
- Auth flow priority: email/password first.
- Navigation stays aligned with Angular; commented items remain commented.
